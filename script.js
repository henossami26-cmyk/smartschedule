// =========================
// SmartSchedule - Daily View + Calendar + Theme
// =========================

// ------ DOM refs ------
const taskForm = document.querySelector('#task-form');
const taskNameInput = document.querySelector('#task-name');
const taskCategoryInput = document.querySelector('#task-category');
const taskDurationInput = document.querySelector('#task-duration');
const taskDateInput = document.querySelector('#task-date');

const taskList = document.querySelector('#task-list');
const totalHoursElement = document.querySelector('#total-hours');
const categorySummaryElement = document.querySelector('#category-summary');
const clearTasksButton = document.querySelector('#clear-tasks');

const dayProgressText = document.querySelector('#day-progress-text');
const dayProgressFill = document.querySelector('#day-progress-fill');
const dayProgressBar = document.querySelector('#day-progress-bar');

const todayButton = document.querySelector('#today-button');
const prevDayButton = document.querySelector('#prev-day');
const nextDayButton = document.querySelector('#next-day');
const selectedDateLabel = document.querySelector('#selected-date-label');

const calendarToggleButton = document.querySelector('#calendar-toggle');
const calendarPopover = document.querySelector('#calendar-popover');
const calendarDatePicker = document.querySelector('#calendar-date-picker');

const themeToggle = document.querySelector('#themeToggle');
const rootElement = document.documentElement;

// Totals card labels (for dynamic "Today" vs selected date)
const totalsTitle = document.querySelector('#totals .section-header h2');
const hoursLabelElement = document.querySelector('#totals .hours-label');

// ------ storage keys ------
const STORAGE_KEY = 'smartschedule:tasks';
const LEGACY_STORAGE_KEY = 'smartschedule-tasks';
const THEME_STORAGE_KEY = 'smartschedule:theme';

// ------ state ------
let tasks = [];
let selectedDate = getTodayString();
const DAILY_TARGET_HOURS = 8;

// =========================
// Date helpers
// =========================

function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // yyyy-mm-dd
}

function normalizeDateString(value) {
  if (!value) return null;
  const isoCandidate = String(value).slice(0, 10);
  const date = new Date(`${isoCandidate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateString) {
  const normalized = normalizeDateString(dateString) || getTodayString();
  const date = new Date(`${normalized}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function shiftSelectedDate(days) {
  const base = new Date(`${selectedDate}T00:00:00`);
  base.setDate(base.getDate() + days);
  const iso = base.toISOString().slice(0, 10);
  setSelectedDate(iso);
}

// =========================
// Task storage + sanitize
// =========================

function generateTaskId() {
  return `task-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function sanitizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' ? raw.id : generateTaskId();
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  const category = typeof raw.category === 'string' ? raw.category.trim() : '';

  const d = Number(raw.duration);
  const duration = Number.isFinite(d) && d > 0 ? d : 0;
  if (duration <= 0) return null;

  const date = normalizeDateString(raw.date) || getTodayString();

  return { id, name, category, duration, date };
}

function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cleaned = parsed.map(sanitizeTask).filter(Boolean);

    // migrate to new key
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    if (LEGACY_STORAGE_KEY !== STORAGE_KEY) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    return cleaned;
  } catch (e) {
    console.warn('Unable to load tasks:', e);
    return [];
  }
}

function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Unable to save tasks:', e);
  }
}

// =========================
// Core helpers
// =========================

function getTasksForSelectedDate() {
  return tasks.filter((t) => t.date === selectedDate);
}

function updateTotalsLabels() {
  if (!totalsTitle || !hoursLabelElement) return;

  const today = getTodayString();

  if (selectedDate === today) {
    totalsTitle.textContent = 'Today';
    hoursLabelElement.textContent = 'hours today';
  } else {
    totalsTitle.textContent = formatDateLabel(selectedDate);

    const d = new Date(selectedDate + 'T00:00:00');
    const short = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    hoursLabelElement.textContent = `hours on ${short}`;
  }
}

function setSelectedDate(dateString) {
  const normalized = normalizeDateString(dateString) || getTodayString();
  selectedDate = normalized;

  if (selectedDateLabel) {
    selectedDateLabel.textContent = formatDateLabel(selectedDate);
  }
  if (taskDateInput) {
    taskDateInput.value = selectedDate;
  }
  if (calendarDatePicker) {
    calendarDatePicker.value = selectedDate;
  }

  updateTotalsLabels();
  renderTasksForSelectedDate();
}

function resetForm() {
  if (!taskForm) return;
  taskNameInput.value = '';
  taskCategoryInput.value = '';
  taskDurationInput.value = '';
  if (taskDateInput) {
    taskDateInput.value = selectedDate || getTodayString();
  }
  taskNameInput.focus();
}

function removeTaskById(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasksToStorage();
  renderTasksForSelectedDate();
}

// =========================
// Rendering
// =========================

function formatDurationLabel(duration) {
  const n = Math.round((Number(duration) || 0) * 100) / 100;
  return Number.isInteger(n) ? `${n}h` : `${n.toFixed(2)}h`;
}

function renderTasksForSelectedDate() {
  if (!taskList) return [];

  const dailyTasks = getTasksForSelectedDate();
  taskList.innerHTML = '';

  dailyTasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;

    li.innerHTML = `
      <div class="task-main">
        <div class="task-title">${task.name}</div>
        <div class="task-meta">
          ${task.category || 'Uncategorized'} · ${formatDurationLabel(task.duration)}
        </div>
      </div>
      <button class="icon-button delete-task" aria-label="Delete task">&times;</button>
    `;

    const deleteBtn = li.querySelector('.delete-task');
    deleteBtn.addEventListener('click', () => {
      removeTaskById(task.id);
    });

    taskList.appendChild(li);
  });

  renderCategorySummary(dailyTasks);
  updateDailySummary(dailyTasks);

  return dailyTasks;
}

function renderCategorySummary(dailyTasks) {
  if (!categorySummaryElement) return;

  if (!dailyTasks.length) {
    categorySummaryElement.innerHTML = '<p>No tasks for this day yet.</p>';
    return;
  }

  const byCategory = new Map();
  for (const task of dailyTasks) {
    const key = task.category || 'Uncategorized';
    byCategory.set(key, (byCategory.get(key) || 0) + (Number(task.duration) || 0));
  }

  categorySummaryElement.innerHTML = '';
  for (const [category, hours] of byCategory.entries()) {
    const pill = document.createElement('div');
    pill.className = 'category-pill';
    pill.textContent = `${category}: ${hours.toFixed(2)}h`;
    categorySummaryElement.appendChild(pill);
  }
}

function updateDailySummary(dailyTasks) {
  const total = dailyTasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

  if (totalHoursElement) {
    totalHoursElement.textContent = total.toFixed(2);
  }

  const pct =
    DAILY_TARGET_HOURS > 0
      ? Math.min(100, (total / DAILY_TARGET_HOURS) * 100)
      : 0;

  if (dayProgressText) {
    dayProgressText.textContent = `${Math.round(pct)}% of ${DAILY_TARGET_HOURS}h`;
  }

  if (dayProgressFill) {
    dayProgressFill.style.width = `${pct}%`;
  }

  if (dayProgressBar) {
    dayProgressBar.setAttribute('aria-valuemin', '0');
    dayProgressBar.setAttribute('aria-valuemax', String(DAILY_TARGET_HOURS));
    dayProgressBar.setAttribute('aria-valuenow', String(Math.min(total, DAILY_TARGET_HOURS)));
  }
}

// =========================
// Calendar popover
// =========================

function toggleCalendarPopover() {
  if (!calendarPopover || !calendarToggleButton) return;
  const willShow = calendarPopover.hasAttribute('hidden');

  if (willShow) {
    calendarPopover.removeAttribute('hidden');
    calendarToggleButton.setAttribute('aria-expanded', 'true');
    if (calendarDatePicker) calendarDatePicker.focus();
  } else {
    calendarPopover.setAttribute('hidden', '');
    calendarToggleButton.setAttribute('aria-expanded', 'false');
  }
}

// =========================
// Theming
// =========================

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

  const mq =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  return mq && mq.matches ? 'dark' : 'light';
}

// =========================
// Init
// =========================

(function init() {
  // Load tasks
  tasks = loadTasksFromStorage();

  // Ensure selectedDate and inputs are in sync
  if (!selectedDate) selectedDate = getTodayString();
  if (taskDateInput && !taskDateInput.value) {
    taskDateInput.value = selectedDate;
  }
  if (calendarDatePicker && !calendarDatePicker.value) {
    calendarDatePicker.value = selectedDate;
  }

  setSelectedDate(selectedDate); // also calls updateTotalsLabels

  // ---- Form submit ----
  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = taskNameInput.value.trim();
      const category = (taskCategoryInput.value || '').trim();
      const duration = Number(taskDurationInput.value);
      const dateRaw =
        (taskDateInput && taskDateInput.value) || selectedDate || getTodayString();
      const date = normalizeDateString(dateRaw) || getTodayString();

      if (!name || !Number.isFinite(duration) || duration <= 0) return;

      const newTask = {
        id: generateTaskId(),
        name,
        category,
        duration,
        date,
      };

      tasks.push(newTask);
      saveTasksToStorage();

      // Jump view to that day so the card + list match
      setSelectedDate(date);
      resetForm();
    });
  }

  // ---- Clear tasks for selected day ----
  if (clearTasksButton) {
    clearTasksButton.addEventListener('click', () => {
      const dailyTasks = getTasksForSelectedDate();
      if (!dailyTasks.length) return;

      if (confirm('Clear all tasks for this day? (Tasks on other days will be kept.)')) {
        tasks = tasks.filter((t) => t.date !== selectedDate);
        saveTasksToStorage();
        renderTasksForSelectedDate();
      }
    });
  }

  // ---- Day navigation ----
  if (prevDayButton) {
    prevDayButton.addEventListener('click', () => shiftSelectedDate(-1));
  }

  if (nextDayButton) {
    nextDayButton.addEventListener('click', () => shiftSelectedDate(1));
  }

  if (todayButton) {
    todayButton.addEventListener('click', () => setSelectedDate(getTodayString()));
  }

  // ---- Calendar ----
  if (calendarToggleButton) {
    calendarToggleButton.addEventListener('click', toggleCalendarPopover);
  }

  if (calendarDatePicker && calendarPopover) {
    calendarDatePicker.addEventListener('change', (event) => {
      const chosen = normalizeDateString(event.target.value);
      if (chosen) {
        setSelectedDate(chosen);
      }
      calendarPopover.setAttribute('hidden', '');
      calendarToggleButton.setAttribute('aria-expanded', 'false');
    });

    calendarPopover.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        calendarPopover.setAttribute('hidden', '');
        calendarToggleButton.setAttribute('aria-expanded', 'false');
        calendarToggleButton.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!calendarPopover || calendarPopover.hasAttribute('hidden')) return;
      if (
        event.target === calendarPopover ||
        calendarPopover.contains(event.target) ||
        event.target === calendarToggleButton
      ) {
        return;
      }
      calendarPopover.setAttribute('hidden', '');
      calendarToggleButton.setAttribute('aria-expanded', 'false');
    });
  }

  // ---- Theme init ----
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
      prefersDark.addListener(handlePreferenceChange);
    }
  }
})();
