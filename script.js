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

// ------ storage ------
const STORAGE_KEY = 'smartschedule-tasks';
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
  } catch (e) {
    console.error('Failed to load tasks', e);
  }
}

// ------ rendering ------
function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const details = document.createElement('div');
    details.className = 'details';

    const name = document.createElement('span');
    name.className = 'task-name';
    name.textContent = task.name;

    const meta = document.createElement('span');
    meta.className = 'task-meta';
    meta.textContent = task.category ? task.category : 'Uncategorized';

    details.append(name, meta);

    const duration = document.createElement('span');
    duration.className = 'task-duration';
    duration.textContent = `${task.duration}h`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'secondary-button';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
      renderTotals();
    });

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(duration, removeBtn);

    li.append(details, actions);
    taskList.append(li);
  });
}

function renderTotals() {
  const total = tasks.reduce((sum, t) => sum + t.duration, 0);
  totalHoursElement.textContent = total.toFixed(2).replace(/\.00$/, '');

  // Day progress (24h)
  const pct = Math.min(Math.max((total / 24) * 100, 0), 100);
  const pctDisplay = Math.round(pct * 10) / 10;

  if (dayProgressText) {
    dayProgressText.textContent = `You've planned ${pctDisplay.toFixed(1)}% of your day`;
  }
  if (dayProgressFill) {
    dayProgressFill.style.width = `${pct}%`;
  }
  if (dayProgressBar) {
    dayProgressBar.setAttribute('aria-valuenow', pctDisplay.toFixed(1));
  }

  // Category summary
  const byCat = tasks.reduce((acc, t) => {
    const key = t.category || 'Uncategorized';
    acc[key] = (acc[key] || 0) + t.duration;
    return acc;
  }, {});

  categorySummaryElement.innerHTML = '';
  Object.entries(byCat).forEach(([cat, hrs]) => {
    const row = document.createElement('div');
    row.className = 'category-item';
    row.innerHTML = `<span>${cat}</span><span>${hrs.toFixed(2).replace(/\.00$/, '')} h</span>`;
    categorySummaryElement.append(row);
  });
}

function resetForm() {
  taskNameInput.value = '';
  taskCategoryInput.value = '';
  taskDurationInput.value = '';
  taskNameInput.focus();
}

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

// ------ init ------
loadTasks();
renderTasks();
renderTotals();
