/* ============================================================
   Dashboard App — Vanilla JS
   Features: greeting, clock, theme, custom name, Pomodoro timer
             with custom duration, to-do (add/edit/delete/done),
             prevent duplicate tasks, sort tasks, quick links
   ============================================================ */

// ── Storage helpers ──────────────────────────────────────────
const store = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

// ── Toast notification ────────────────────────────────────────
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(msg, type = 'warn') {
  toastEl.textContent = msg;
  toastEl.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

// ── Greeting & Clock ─────────────────────────────────────────
const greetingEl  = document.getElementById('greeting');
const datetimeEl  = document.getElementById('datetime');
const nameEditBtn = document.getElementById('nameEditBtn');

let userName = store.get('userName', '');

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getGreetingEmoji(hour) {
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  if (hour < 21) return '🌆';
  return '🌙';
}

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  const base  = getGreeting(hour);
  const emoji = getGreetingEmoji(hour);
  const name  = userName ? `, ${userName}` : '';
  greetingEl.textContent = `${base}${name}! ${emoji}`;

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  datetimeEl.textContent = `${dateStr} · ${timeStr}`;
}

updateClock();
setInterval(updateClock, 1000);

// ── Custom Name Modal ─────────────────────────────────────────
const nameModal     = document.getElementById('nameModal');
const nameInput     = document.getElementById('nameInput');
const saveNameBtn   = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');

nameEditBtn.addEventListener('click', () => {
  nameInput.value = userName;
  nameModal.classList.add('active');
  nameInput.focus();
  nameInput.select();
});

function closeNameModal() {
  nameModal.classList.remove('active');
}

saveNameBtn.addEventListener('click', () => {
  userName = nameInput.value.trim();
  store.set('userName', userName);
  updateClock();
  closeNameModal();
});

cancelNameBtn.addEventListener('click', closeNameModal);

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
  if (e.key === 'Escape') closeNameModal();
});

nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});

// ── Theme Toggle ─────────────────────────────────────────────
const html        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

let currentTheme = store.get('theme', 'light');
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  store.set('theme', currentTheme);
});

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// ── Focus Timer ───────────────────────────────────────────────
let timerDuration = store.get('timerDuration', 25) * 60; // seconds

const timerDisplay   = document.getElementById('timerDisplay');
const startBtn       = document.getElementById('startBtn');
const stopBtn        = document.getElementById('stopBtn');
const resetBtn       = document.getElementById('resetBtn');
const progressFill   = document.getElementById('timerProgressFill');
const durationInput  = document.getElementById('durationInput');
const setDurationBtn = document.getElementById('setDurationBtn');

durationInput.value = store.get('timerDuration', 25);

let timerInterval = null;
let timeLeft  = timerDuration;
let isRunning = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(timeLeft);
  const pct = (timeLeft / timerDuration) * 100;
  progressFill.style.width = pct + '%';
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  setDurationBtn.disabled = true;
  durationInput.disabled  = true;

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      setDurationBtn.disabled = false;
      durationInput.disabled  = false;
      timerDisplay.textContent = '00:00';
      progressFill.style.width = '0%';
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete!', { body: 'Time for a break.' });
      }
      showToast('⏰ Focus session complete!', 'success');
      return;
    }
    timeLeft--;
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  setDurationBtn.disabled = false;
  durationInput.disabled  = false;
}

function resetTimer() {
  stopTimer();
  timeLeft = timerDuration;
  updateTimerUI();
}

function setDuration() {
  if (isRunning) {
    showToast('Stop the timer before changing duration.', 'warn');
    return;
  }
  let mins = parseInt(durationInput.value, 10);
  if (isNaN(mins) || mins < 1)  mins = 1;
  if (mins > 120) mins = 120;
  durationInput.value = mins;
  timerDuration = mins * 60;
  timeLeft = timerDuration;
  store.set('timerDuration', mins);
  updateTimerUI();
  showToast(`Timer set to ${mins} minute${mins !== 1 ? 's' : ''}.`, 'success');
}

startBtn.addEventListener('click', () => {
  if (Notification.permission === 'default') Notification.requestPermission();
  startTimer();
});
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
setDurationBtn.addEventListener('click', setDuration);
durationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setDuration();
});

updateTimerUI();

// ── To-Do List ────────────────────────────────────────────────
const todoInput  = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList   = document.getElementById('todoList');
const todoEmpty  = document.getElementById('todoEmpty');

let todos    = store.get('todos', []);
let sortMode = store.get('sortMode', 'none');

function saveTodos() {
  store.set('todos', todos);
}

function getSortedTodos() {
  const copy = [...todos];
  if (sortMode === 'az')   return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sortMode === 'za')   return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sortMode === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTodos() {
  todoList.innerHTML = '';
  const sorted = getSortedTodos();
  todoEmpty.style.display = sorted.length === 0 ? 'block' : 'none';

  sorted.forEach((todo) => {
    const realIndex = todos.findIndex(t => t.id === todo.id);

    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} aria-label="Mark done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-edit" title="Edit task">✏️</button>
        <button class="btn btn-danger" title="Delete task">🗑️</button>
      </div>
    `;

    li.querySelector('.todo-checkbox').addEventListener('change', () => {
      todos[realIndex].done = !todos[realIndex].done;
      saveTodos();
      renderTodos();
    });

    li.querySelector('.btn-edit').addEventListener('click', () => openEditModal(realIndex));

    li.querySelector('.btn-danger').addEventListener('click', () => {
      todos.splice(realIndex, 1);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(li);
  });
}

function isDuplicate(text, excludeId = null) {
  return todos.some(t =>
    t.text.trim().toLowerCase() === text.trim().toLowerCase() &&
    t.id !== excludeId
  );
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  if (isDuplicate(text)) {
    showToast('⚠️ Task already exists!', 'warn');
    todoInput.select();
    return;
  }

  todos.unshift({ text, done: false, id: Date.now() });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ── Sort Buttons ──────────────────────────────────────────────
const sortBtns = document.querySelectorAll('.btn-sort');

function applySortUI() {
  sortBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === sortMode);
  });
}

sortBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sortMode = btn.dataset.sort;
    store.set('sortMode', sortMode);
    applySortUI();
    renderTodos();
  });
});

applySortUI();
renderTodos();

// ── Edit Modal ────────────────────────────────────────────────
const editModal     = document.getElementById('editModal');
const editInput     = document.getElementById('editInput');
const saveEditBtn   = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let editingIndex = null;

function openEditModal(index) {
  editingIndex = index;
  editInput.value = todos[index].text;
  editModal.classList.add('active');
  editInput.focus();
  editInput.select();
}

function closeEditModal() {
  editModal.classList.remove('active');
  editingIndex = null;
}

saveEditBtn.addEventListener('click', () => {
  const text = editInput.value.trim();
  if (!text || editingIndex === null) return;

  if (isDuplicate(text, todos[editingIndex].id)) {
    showToast('⚠️ Another task with that name already exists!', 'warn');
    editInput.select();
    return;
  }

  todos[editingIndex].text = text;
  saveTodos();
  renderTodos();
  closeEditModal();
});

cancelEditBtn.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEditBtn.click();
  if (e.key === 'Escape') closeEditModal();
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// ── Quick Links ───────────────────────────────────────────────
const linkNameInput = document.getElementById('linkName');
const linkUrlInput  = document.getElementById('linkUrl');
const addLinkBtn    = document.getElementById('addLinkBtn');
const linksGrid     = document.getElementById('linksGrid');
const linksEmpty    = document.getElementById('linksEmpty');

let links = store.get('links', [
  { name: 'Google',   url: 'https://google.com' },
  { name: 'YouTube',  url: 'https://youtube.com' },
  { name: 'GitHub',   url: 'https://github.com' }
]);

function saveLinks() {
  store.set('links', links);
}

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch { return null; }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  linksEmpty.style.display = links.length === 0 ? 'block' : 'none';

  links.forEach((link, index) => {
    const favicon = getFaviconUrl(link.url);

    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href = link.url;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';

    chip.innerHTML = `
      ${favicon ? `<img class="link-favicon" src="${favicon}" alt="" onerror="this.style.display='none'" />` : ''}
      ${escapeHtml(link.name)}
      <button class="link-remove" title="Remove link" aria-label="Remove ${escapeHtml(link.name)}">✕</button>
    `;

    chip.querySelector('.link-remove').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  let url = linkUrlInput.value.trim();
  if (!name || !url) return;

  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try {
    new URL(url);
  } catch {
    linkUrlInput.style.borderColor = 'var(--danger)';
    setTimeout(() => linkUrlInput.style.borderColor = '', 1500);
    return;
  }

  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

addLinkBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

renderLinks();

// ── Utility ───────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
