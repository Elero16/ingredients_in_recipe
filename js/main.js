/**
 * Конфигурация приложения
 */
const CONFIG = {
  fontSize: {
    min: 10,
    max: 20,
    step: 1
  },
  theme: {
    dark: {
      theme: 'dark',
      icon: '<i class="bi bi-sun-fill"></i>',
      storageKey: 'theme'
    },
    light: {
      theme: 'light',
      icon: '<i class="bi bi-moon-stars-fill"></i>',
      storageKey: 'theme'
    }
  }
};

/**
 * DOM элементы
 */
const elements = {
  // Управление шрифтом
  decreaseFontBtn: document.getElementById('decrease_fs_btn'),
  increaseFontBtn: document.getElementById('increase_fs_btn'),
  
  // Управление темой
  themeToggle: document.getElementById('change_theme_btn'),
  htmlElement: document.documentElement,
  
  // Управление рецептами
  recipeName: document.getElementById('recipe_name'),
  addBtn: document.getElementById('add_btn'),
  originalRecipe: document.getElementById('original_recipe'),
  modifiedRecipe: document.getElementById('modified_recipe'),
  modifiedRecipeBody: document.getElementById('modified_recipe_body'),
  calculateBtn: document.getElementById('calculate_btn'),
  copyBtn: document.getElementById('copy_btn'),
  
  // Поля ввода
  itemName: document.getElementById('item_name'),
  itemCount: document.getElementById('item_count'),
  itemType: document.getElementById('item_type'),
  ratioType: document.getElementById('how_many_times_to_change'),
  ratioValue: document.getElementById('how_many_times')
};

/**
 * Состояние приложения
 */
let state = {
  recipe: []
};

/**
 * Управление шрифтом
 */
function changeFontSize(direction) {
  const currentSize = parseInt(window.getComputedStyle(document.body).fontSize);
  let newSize = currentSize;

  if (direction === 'decrease' && currentSize > CONFIG.fontSize.min) {
    newSize = currentSize - CONFIG.fontSize.step;
  } else if (direction === 'increase' && currentSize < CONFIG.fontSize.max) {
    newSize = currentSize + CONFIG.fontSize.step;
  }

  if (newSize !== currentSize) {
    document.body.style.fontSize = `${newSize}px`;
  }
}

/**
 * Управление темой
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem(CONFIG.theme.dark.storageKey);
  const isDarkTheme = savedTheme === CONFIG.theme.dark.theme;
  setTheme(isDarkTheme ? CONFIG.theme.dark : CONFIG.theme.light);
}

function setTheme(theme) {
  elements.htmlElement.setAttribute('data-bs-theme', theme.theme);
  elements.themeToggle.innerHTML = theme.icon;
  localStorage.setItem(theme.storageKey, theme.theme);
}

function toggleTheme() {
  const isDarkTheme = elements.htmlElement.getAttribute('data-bs-theme') === CONFIG.theme.dark.theme;
  setTheme(isDarkTheme ? CONFIG.theme.light : CONFIG.theme.dark);
}

/**
 * Управление рецептами
 */
function renderRecipeList(container, recipeList, action, modifier, isNew = false) {
  const containerElement = document.getElementById(container);
  containerElement.innerHTML = '';

  recipeList.forEach(item => {
    let count = item.count || 'по вкусу';
    let type = item.count ? item.type : '';

    if (count !== 'по вкусу') {
      if (action === "*") {
        count *= modifier;
      } else if (action === "/") {
        count /= modifier;
      }
    }

    const li = document.createElement('li');
    li.classList.add("list-group-item")
    li.innerHTML = isNew
      ? `<div><div>${item.name} ${count} ${type}</div></div>`
      : `<div class="d-flex justify-content-between">
           <div>${item.name} ${count} ${type}</div>
           <button class="remove-btn btn btn-danger btn-sm" data-name="${item.name}">
             <i class="bi bi-trash-fill" data-name="${item.name}"></i>
           </button>
         </div>`;
    
    containerElement.appendChild(li);
  });
}

function addIngredient() {
  const name = elements.itemName.value.trim();
  const count = elements.itemCount.value;
  const type = elements.itemType.value;

  if (!name) {
    const myModal = new bootstrap.Modal('#warning-modal')
    document.getElementById('warning-modal-text').textContent = 'Введите название ингредиента!'
    myModal.show()
    return;
  }

  if (state.recipe.some(item => item.name === name)) {
    const myModal = new bootstrap.Modal('#warning-modal')
    document.getElementById('warning-modal-text').textContent = 'Такой ингредиент уже есть!'
    myModal.show()
    elements.itemName.value = '';
    elements.itemCount.value = '';
    return;
  }

  state.recipe.push({
    name,
    count: count || 'по вкусу',
    type: count ? type : ''
  });

  renderRecipeList('original_recipe', state.recipe, '*', 1);
  elements.itemName.value = '';
  elements.itemCount.value = '';
}

function removeIngredient(name) {
  state.recipe = state.recipe.filter(item => item.name !== name);
  renderRecipeList('original_recipe', state.recipe, '*', 1);
}

function updateRecipeName() {
  // Функция для редактирования текста
  function makeEditable(element) {
    element.addEventListener('click', function() {
      const currentText = this.textContent;
      const input = document.createElement('input');
      input.value = currentText;
      input.className = 'form-control';
      
      this.innerHTML = '';
      this.appendChild(input);
      input.focus();

      // Сохраняем изменения при нажатии Enter или потере фокуса
      input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            saveChanges();
          }
      });

      input.addEventListener('blur', saveChanges);

      function saveChanges() {
        if(!input.value) input.value = 'Название рецепта'
        element.textContent = input.value;
      }
    });
  }

  // Применяем функцию к элементам
  const editableText = document.getElementById('recipe_name');
  makeEditable(editableText);
}

function calculateRecipe() {
  elements.modifiedRecipe.style.display = 'block';
  elements.modifiedRecipeBody.innerHTML = '';
  
  const ratioType = +elements.ratioType.value;
  const ratio = +elements.ratioValue.value;
  
  if (!ratio) {
    const myModal = new bootstrap.Modal('#warning-modal')
    document.getElementById('warning-modal-text').textContent = 'Введите любое число кроме нуля!'
    myModal.show()
    return;
  }

  const action = ratioType === 1 ? '/' : '*';
  renderRecipeList('modified_recipe_body', state.recipe, action, ratio, true);
}

async function copyRecipe() {
  try {
    await navigator.clipboard.writeText(elements.modifiedRecipe.innerText);
    const myModal = new bootstrap.Modal('#warning-modal')
    document.getElementById('warning-modal-text').textContent = 'Рецепт успешно скопирован!'
    myModal.show()
  } catch (err) {
    console.error('Не удалось скопировать текст:', err);
  }
}

/**
 * Инициализация приложения
 */
function init() {
  // Управление шрифтом
  elements.decreaseFontBtn.addEventListener('click', () => changeFontSize('decrease'));
  elements.increaseFontBtn.addEventListener('click', () => changeFontSize('increase'));

  // Управление темой
  initializeTheme();
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Управление рецептами
  elements.addBtn.addEventListener('click', addIngredient);
  elements.originalRecipe.addEventListener('click', (e) => {
    if (e.target.dataset.name) {
      removeIngredient(e.target.dataset.name);
    }
  });
  elements.recipeName.addEventListener('click', updateRecipeName);
  elements.calculateBtn.addEventListener('click', calculateRecipe);
  elements.copyBtn.addEventListener('click', copyRecipe);
}

// Запуск приложения
init();