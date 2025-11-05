const taskForm = document.querySelector('#task-form');
const taskNameInput = document.querySelector('#task-name');
const taskCategoryInput = document.querySelector('#task-category');
const taskDurationInput = document.querySelector('#task-duration');
const taskList = document.querySelector('#task-list');
const totalHoursElement = document.querySelector('#total-hours');
const categorySummaryElement = document.querySelector('#category-summary');
const clearTasksButton = document.querySelector('#clear-tasks');

const STORAGE_KEY = 'smartschedule-tasks';

let tasks = [];

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return;
    }

    tasks = parsed
      .filter((task) =>
        typeof task === 'object' &&
        task !== null &&
        'name' in task &&
        typeof task.name === 'string' &&
        'duration' in task &&
        Number.isFinite(Number(task.duration))
      )
      .map((task) => ({
        name: task.name,
        category: typeof task.category === 'string' ? task.category : '',
        duration: Number(task.duration),
      }));
  } catch (error) {
    console.error('Failed to load tasks from storage', error);
  }
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'task-item';

    const details = document.createElement('div');
    details.className = 'details';

    const name = document.createElement('span');
    name.className = 'task-name';
    name.textContent = task.name;

    const meta = document.createElement('span');
    meta.className = 'task-meta';
    meta.textContent = task.category ? `${task.category}` : 'Uncategorized';

    details.append(name, meta);

    const duration = document.createElement('span');
    duration.className = 'task-duration';
    duration.textContent = `${task.duration}h`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'secondary-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      tasks.splice(index, 1);
      renderTasks();
      renderTotals();
      saveTasks();
    });

    const actionGroup = document.createElement('div');
    actionGroup.className = 'actions';
    actionGroup.append(duration, removeButton);

    listItem.append(details, actionGroup);
    taskList.append(listItem);
  });
}

function renderTotals() {
  const total = tasks.reduce((sum, task) => sum + task.duration, 0);
  totalHoursElement.textContent = total.toFixed(2).replace(/\.00$/, '');

  const categoryTotals = tasks.reduce((acc, task) => {
    const key = task.category || 'Uncategorized';
    acc[key] = (acc[key] || 0) + task.duration;
    return acc;
  }, {});

  categorySummaryElement.innerHTML = '';
  Object.entries(categoryTotals).forEach(([category, hours]) => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.innerHTML = `<span>${category}</span><span>${hours.toFixed(2).replace(/\\.00$/, '')} h</span>`;
    categoryItem.innerHTML = `<span>${category}</span><span>${hours.toFixed(2).replace(/\.00$/, '')} h</span>`;
    categorySummaryElement.append(categoryItem);
  });
}

function resetForm() {
  taskNameInput.value = '';
  taskCategoryInput.value = '';
  taskDurationInput.value = '';
  taskNameInput.focus();
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = taskNameInput.value.trim();
  const category = taskCategoryInput.value.trim();
  const duration = parseFloat(taskDurationInput.value);

  if (!name || Number.isNaN(duration) || duration <= 0) {
    return;
  }

  tasks.push({
    name,
    category,
    duration,
  });

  renderTasks();
  renderTotals();
  saveTasks();
  resetForm();
});

clearTasksButton.addEventListener('click', () => {
  tasks.length = 0;
  renderTasks();
  renderTotals();
  localStorage.removeItem(STORAGE_KEY);
});

loadTasks();
renderTasks();
renderTotals();
