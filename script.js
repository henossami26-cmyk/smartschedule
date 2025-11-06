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

// ------ helpers ------
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Unable to save tasks:', e);
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    tasks = parsed
      .filter(
        (t) =>
          t &&
          typeof t === 'object' &&
          typeof t.name === 'string' &&
          Number.isFinite(Number(t.duration))
      )
      .map((t) => ({
        name: t.name.trim(),
        category: typeof t.category === 'string' ? t.category.trim() : '',
        duration: Number(t.duration),
      }));
  } catch (e) {
    console.warn('Unable to load tasks:', e);
  }
}

function resetForm() {
  if (!taskForm) return;
  taskNameInput.value = '';
  taskCategoryInput.value = '';
  taskDurationInput.value = '';
  taskNameInput.focus();
}

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';

  tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const details = document.createElement('div');
    details.className = 'details';

    const nameEl = document.createElement('div');
    nameEl.className = 'task-name';
    nameEl.textContent = t.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'task-meta';
    metaEl.textContent = t.category ? `${t.category}` : 'Uncategorized';

    details.appendChild(nameEl);
    details.appendChild(metaEl);

    const durEl = document.createElement('div');
    durEl.className = 'task-duration';
    durEl.textContent = `${t.duration}h`;

    li.appendChild(details);
    li.appendChild(durEl);

    // Optional: remove on click (lightweight UX)
    li.addEventListener('click', () => {
      tasks.splice(idx, 1);
      saveTasks();
      renderTasks();
      renderTotals();
    });

    taskList.appendChild(li);
  });
}

function renderTotals() {
  const total = tasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
  if (totalHoursElement) totalHoursElement.textContent = total.toFixed(2);

  // Category summary
  if (categorySummaryElement) {
    const byCat = new Map();
    for (const t of tasks) {
      const key = t.category || 'Uncategorized';
      byCat.set(key, (byCat.get(key) || 0) + (Number(t.duration) || 0));
    }

    categorySummaryElement.innerHTML = '';
    for (const [cat, hrs] of byCat.entries()) {
      const row = document.createElement('div');
      row.className = 'category-item';
      row.innerHTML = `<span>${cat}</span><span>${hrs.toFixed(2)}h</span>`;
      categorySummaryElement.appendChild(row);
    }
  }

  updateProgress(total);
}

function updateProgress(totalHours) {
  const target = 8; // daily target
  const pct = Math.max(0, Math.min(100, (totalHours / target) * 100 || 0));

  if (dayProgressText) {
    dayProgressText.textContent = `${pct.toFixed(0)}% of ${target}h`;
  }
  if (dayProgressFill) {
    dayProgressFill.style.width = `${pct}%`;
  }
  if (dayProgressBar) {
    dayProgressBar.setAttribute('aria-valuemin', '0');
    dayProgressBar.setAttribute('aria-valuemax', String(target));
    dayProgressBar.setAttribute('aria-valuenow', String(totalHours));
  }
}

// ------ events ------
if (taskForm) {
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
}

if (clearTasksButton) {
  clearTasksButton.addEventListener('click', () => {
    tasks.length = 0;
    saveTasks();
    renderTasks();
    renderTotals();
  });
}

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
    themeToggle.setAttribute(
      'title',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }
}

function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
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
    } catch {
      /* ignore */
    }
  });
}

const prefersDark =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDark) {
  const handlePreferenceChange = (event) => {
    // Respect manual choice in storage; only react if user hasn't set one.
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return;
    } catch {
      /* ignore */
    }
    applyTheme(event.matches ? 'dark' : 'light');
  };

  if (typeof prefersDark.addEventListener === 'function') {
    prefersDark.addEventListener('change', handlePreferenceChange);
  } else if (typeof prefersDark.addListener === 'function') {
    // Safari <14
    prefersDark.addListener(handlePreferenceChange);
  }
}

// ------ init ------
loadTasks();
renderTasks();
renderTotals();
