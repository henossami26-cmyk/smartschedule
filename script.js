// ------ DOM refs ------
const taskForm = document.querySelector('#task-form');
const taskNameInput = document.querySelector('#task-name');
const taskCategoryInput = document.querySelector('#task-category');
const taskDurationInput = document.querySelector('#task-duration');
const taskList = document.querySelector('#task-list');
const totalHoursElement = document.querySelector('#total-hours');
const categorySummaryElement = document.querySelector('#category-summary');
const clearTasksButton = document.querySelector('#clear-tasks');
const dayProgressText = document.querySelector('#day-progress-text');
const dayProgressFill = document.querySelector('#day-progress-fill');
const dayProgressBar = document.querySelector('#day-progress-bar');
const themeToggle = document.querySelector('#themeToggle');
const rootElement = document.documentElement;

// ------ storage ------
const STORAGE_KEY = 'smartschedule-tasks';
const THEME_STORAGE_KEY = 'smartschedule:theme';
let tasks = [];

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    tasks = parsed
      .filter(t =>
        t && typeof t === 'object' &&
        typeof t.name === 'string' &&
        Number.isFinite(Number(t.duration))
      )
      .map(t => ({
        name: t.name.trim(),
        category: typeof t.category === 'string' ? t.category.trim() : '',
        duration: Number(t.duration)
      }));
function resetForm() {

// ------ events ------
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = taskNameInput.value.trim();
  const category = taskCategoryInput.value.trim();
  const duration = Number(taskDurationInput.value);

  if (!name || !Number.isFinite(duration) || duration <= 0) return;

  tasks.push({ name, category, duration });
  saveTasks();
  renderTasks();
  renderTotals();
  resetForm();
});

clearTasksButton.addEventListener('click', () => {
  tasks.length = 0;
  saveTasks();
  renderTasks();
  renderTotals();
});

// ------ theming ------
function applyTheme(theme) {
  const isDark = theme === 'dark';

  if (isDark) {
    rootElement.setAttribute('data-theme', 'dark');
  } else {
    rootElement.removeAttribute('data-theme');
  }

  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch (error) {
    console.warn('Unable to read theme preference from storage.', error);
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = rootElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';

    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('Unable to persist theme preference.', error);
    }
  });
}

const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
if (prefersDark) {
  const handlePreferenceChange = event => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return;
      }
    } catch (error) {
      console.warn('Unable to access theme preference on change.', error);
      return;
    }

    applyTheme(event.matches ? 'dark' : 'light');
  };

  if (typeof prefersDark.addEventListener === 'function') {
    prefersDark.addEventListener('change', handlePreferenceChange);
  } else if (typeof prefersDark.addListener === 'function') {
    prefersDark.addListener(handlePreferenceChange);
  }
}

// ------ init ------
loadTasks();
renderTasks();
renderTotals();
