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
@@ -71,50 +74,66 @@ function renderTasks() {

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

  const percentageOfDay = (total / 24) * 100;
  const boundedPercentage = Math.min(Math.max(percentageOfDay, 0), 100);
  const roundedDisplay = Math.round(percentageOfDay * 10) / 10;

  if (dayProgressText) {
    dayProgressText.textContent = `You’ve planned ${roundedDisplay.toFixed(1)}% of your day`;
  }

  if (dayProgressFill) {
    dayProgressFill.style.width = `${boundedPercentage}%`;
  }

  if (dayProgressBar) {
    dayProgressBar.setAttribute('aria-valuenow', boundedPercentage.toFixed(1));
  }

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
