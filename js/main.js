// Конфиг
const CONFIG = {
  fontSize: { min: 10, max: 20, step: 1 },
  theme: {
    dark: { theme: 'dark', icon: '<i class="bi bi-sun-fill"></i>' },
    light: { theme: 'light', icon: '<i class="bi bi-moon-stars-fill"></i>' }
  },
  suggestions: ['Мука', 'Сахар', 'Соль', 'Вода', 'Молоко', 'Яйца', 'Масло', 'Сметана']
};

// DOM
const $ = (id) => document.getElementById(id);
const elements = {
  // Шрифт и тема
  decreaseFontBtn: $('decrease_fs_btn'),
  increaseFontBtn: $('increase_fs_btn'),
  themeToggle: $('change_theme_btn'),
  htmlElement: document.documentElement,
  voiceBtn: $('voice_btn'),

  // Ингредиенты
  itemName: $('item_name'),
  itemCount: $('item_count'),
  itemType: $('item_type'),
  addBtn: $('add_btn'),
  originalRecipe: $('original_recipe'),

  // Порции
  portionsOld: $('portions_old'),
  portionsNew: $('portions_new'),
  calculateByPortions: $('calculate_by_portions'),
  howManyTimes: $('how_many_times'),
  calculateBtn: $('calculate_btn'),

  // Шаблоны
  templates: $('templates'),
  saveTemplateBtn: $('save_template_btn'),
  loadTemplateBtn: $('load_template_btn'),

  // Результат
  recipeName: $('recipe_name'),
  modifiedRecipe: $('modified_recipe'),
  modifiedRecipeBody: $('modified_recipe_body'),
  copyBtn: $('copy_btn'),
  clearBtn: $('clear_btn')
};

// Состояние
let state = { recipe: [], templates: {} };

// Инициализация
function init() {
  loadState();
  loadTemplates();
  initializeTheme();
  setupEventListeners();
  setupVoiceInput();
  showToast('Приложение загружено');
}

// Слушатели
function setupEventListeners() {
  elements.decreaseFontBtn.addEventListener('click', () => changeFontSize('decrease'));
  elements.increaseFontBtn.addEventListener('click', () => changeFontSize('increase'));
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.addBtn.addEventListener('click', addIngredient);
  elements.originalRecipe.addEventListener('click', removeIngredient);
  elements.recipeName.addEventListener('click', makeEditable);
  elements.calculateBtn.addEventListener('click', calculateRecipe);
  elements.calculateByPortions.addEventListener('click', calculateByPortionsHandler);
  elements.copyBtn.addEventListener('click', copyRecipe);
  elements.clearBtn.addEventListener('click', clearAll);
  elements.saveTemplateBtn.addEventListener('click', saveTemplate);
  elements.loadTemplateBtn.addEventListener('click', loadSelectedTemplate);
}

// Шрифт
function changeFontSize(dir) {
  const size = parseInt(getComputedStyle(document.body).fontSize);
  const newSize = dir === 'decrease' ? Math.max(size - 1, 10) : Math.min(size + 1, 20);
  if (newSize !== size) document.body.style.fontSize = `${newSize}px`;
}

// Тема
function initializeTheme() {
  const saved = localStorage.getItem('theme') === 'dark';
  setTheme(saved ? CONFIG.theme.dark : CONFIG.theme.light);
}
function setTheme(theme) {
  elements.htmlElement.setAttribute('data-bs-theme', theme.theme);
  elements.themeToggle.innerHTML = theme.icon;
  localStorage.setItem('theme', theme.theme);
}
function toggleTheme() {
  const isDark = elements.htmlElement.getAttribute('data-bs-theme') === 'dark';
  setTheme(isDark ? CONFIG.theme.light : CONFIG.theme.dark);
}

// Рецепт
function addIngredient() {
  const name = elements.itemName.value.trim();
  const count = elements.itemCount.value;
  const type = elements.itemType.value;

  if (!name) return showModal('Введите название');
  if (state.recipe.some(i => i.name === name)) return showModal('Уже есть');

  state.recipe.push({ name, count: count || 'по вкусу', type: count ? type : '' });
  renderOriginalRecipe();
  saveState();
  clearInputs();
}

function removeIngredient(e) {
  if (!e.target.dataset.name) return;
  const name = e.target.dataset.name;
  state.recipe = state.recipe.filter(i => i.name !== name);
  renderOriginalRecipe();
  saveState();
}

function renderOriginalRecipe() {
  elements.originalRecipe.innerHTML = '';
  state.recipe.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between');
    li.innerHTML = `
      <span>${item.name} ${item.count !== 'по вкусу' ? item.count + ' ' + item.type : 'по вкусу'}</span>
      <button class="btn btn-sm btn-danger" data-name="${item.name}">
        <i class="bi bi-trash" data-name="${item.name}"></i>
      </button>
    `;
    elements.originalRecipe.appendChild(li);
  });
}

// Расчёт
function calculateRecipe() {
  const ratio = parseFloat(elements.howManyTimes.value);
  if (!ratio || ratio <= 0) return showModal('Введите множитель > 0');
  renderModifiedRecipe(ratio);
}

function calculateByPortionsHandler() {
  const old = parseFloat(elements.portionsOld.value);
  const newP = parseFloat(elements.portionsNew.value);
  if (!old || !newP) return showModal('Введите обе порции');
  const ratio = newP / old;
  elements.howManyTimes.value = ratio.toFixed(2);
  renderModifiedRecipe(ratio);
}

function renderModifiedRecipe(ratio) {
  elements.modifiedRecipe.style.display = 'block';
  elements.modifiedRecipeBody.innerHTML = '';

  state.recipe.forEach(item => {
    let count = item.count;
    if (count !== 'по вкусу') {
      count = (parseFloat(count) * ratio).toFixed(2);
      count = Number.isInteger(count) ? parseInt(count) : parseFloat(count);
    }
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.textContent = `${item.name} ${count} ${item.count !== 'по вкусу' ? item.type : ''}`;
    elements.modifiedRecipeBody.appendChild(li);
  });
}

// Редактирование названия
function makeEditable() {
  const el = elements.recipeName;
  const input = document.createElement('input');
  input.value = el.textContent;
  input.className = 'form-control form-control-sm';
  el.innerHTML = '';
  el.appendChild(input);
  input.focus();

  const save = () => {
    el.textContent = input.value || 'Название рецепта';
    input.remove();
  };

  input.addEventListener('blur', save);
  input.addEventListener('keypress', e => e.key === 'Enter' && save());
}

// Копирование
function copyRecipe() {
  navigator.clipboard.writeText(elements.modifiedRecipe.innerText)
    .then(() => showToast('Скопировано!'))
    .catch(() => showModal('Ошибка копирования'));
}

// Очистка
function clearAll() {
  if (confirm('Очистить всё?')) {
    state.recipe = [];
    renderOriginalRecipe();
    elements.modifiedRecipe.style.display = 'none';
    saveState();
  }
}

// Шаблоны
function saveTemplate() {
  const name = prompt('Название шаблона:')?.trim();
  if (!name || state.recipe.length === 0) return;
  state.templates[name] = [...state.recipe];
  localStorage.setItem('recipeTemplates', JSON.stringify(state.templates));
  loadTemplates();
  showToast(`Шаблон "${name}" сохранён`);
}

function loadTemplates() {
  const saved = localStorage.getItem('recipeTemplates');
  state.templates = saved ? JSON.parse(saved) : {};
  const sel = elements.templates;
  sel.innerHTML = '<option value="">Выберите шаблон...</option>';
  Object.keys(state.templates).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    sel.appendChild(opt);
  });
}

function loadSelectedTemplate() {
  const name = elements.templates.value;
  if (!name) return;
  state.recipe = [...state.templates[name]];
  renderOriginalRecipe();
  saveState();
  showToast(`Загружен шаблон: ${name}`);
}

// Голосовой ввод
function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceBtn.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';

  elements.voiceBtn.addEventListener('click', () => {
    recognition.start();
    elements.voiceBtn.classList.add('btn-danger');
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    parseVoiceInput(transcript);
    elements.voiceBtn.classList.remove('btn-danger');
  };

  recognition.onerror = () => elements.voiceBtn.classList.remove('btn-danger');
}

function parseVoiceInput(text) {
  const match = text.match(/(.+?)\s+(\d+)\s+(.+)/) || text.match(/(.+?)\s+по вкусу/);
  if (match) {
    elements.itemName.value = match[1].trim();
    if (match[2]) {
      elements.itemCount.value = match[2];
      elements.itemType.value = match[3] || 'г.';
    } else {
      elements.itemCount.value = '';
    }
    addIngredient();
  } else {
    showModal('Не распознано. Пример: "мука 200 г" или "соль по вкусу"');
  }
}

// Уведомления
function showModal(msg) {
  const modal = new bootstrap.Modal('#warning-modal');
  $('warning-modal-text').textContent = msg;
  modal.show();
}

function showToast(msg) {
  const toast = new bootstrap.Toast('#toast');
  document.querySelector('#toast .toast-body').textContent = msg;
  toast.show();
}

// Сохранение
function saveState() {
  localStorage.setItem('recipeState', JSON.stringify(state.recipe));
}

function loadState() {
  const saved = localStorage.getItem('recipeState');
  if (saved) {
    state.recipe = JSON.parse(saved);
    renderOriginalRecipe();
  }
}

function clearInputs() {
  elements.itemName.value = '';
  elements.itemCount.value = '';
}

// Запуск
init();
