/* ============================================================
   Dashboard App — Vanilla JS
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

// ── Greeting & Clock ─────────────────────────────────────────
const greetingEl = document.getElementById('greeting');
const datetimeEl = document.getElementById('datetime');

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning! ☀️';
  if (hour < 17) return 'Good Afternoon! 🌤️';
  if (hour < 21) return 'Good Evening! 🌆';
  return 'Good Night! 🌙';
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();

  greetingEl.textContent = getGreeting(hour);

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

// ── Theme Toggle ─────────────────────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

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
const TIMER_DURATION = 25 * 60; // seconds

const timerDisplay = document.getElementById('timerDisplay');
const startBtn     = document.getElementById('startBtn');
const stopBtn      = document.getElementById('stopBtn');
const resetBtn     = document.getElementById('resetBtn');
const progressFill = document.getElementById('timerProgressFill');

let timerInterval = null;
let timeLeft = TIMER_DURATION;
let isRunning = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(timeLeft);
  const pct = (timeLeft / TIMER_DURATION) * 100;
  progressFill.style.width = pct + '%';
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      timerDisplay.textContent = '00:00';
      progressFill.style.width = '0%';
      // Notify user
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete!', { body: 'Time for a break.' });
      }
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
  stopBtn.disabled = true;
}

function resetTimer() {
  stopTimer();
  timeLeft = TIMER_DURATION;
  updateTimerUI();
}

startBtn.addEventListener('click', () => {
  // Request notification permission on first start
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  startTimer();
});
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

updateTimerUI();

// ── To-Do List ────────────────────────────────────────────────
const todoInput  = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList   = document.getElementById('todoList');
const todoEmpty  = document.getElementById('todoEmpty');

let todos = store.get('todos', []);

function saveTodos() {
  store.set('todos', todos);
}

function renderTodos() {
  todoList.innerHTML = '';
  const visible = todos;

  todoEmpty.style.display = visible.length === 0 ? 'block' : 'none';

  visible.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.index = index;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} aria-label="Mark done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-edit" title="Edit task">✏️</button>
        <button class="btn btn-danger" title="Delete task">🗑️</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector('.todo-checkbox').addEventListener('change', () => {
      todos[index].done = !todos[index].done;
      saveTodos();
      renderTodos();
    });

    // Edit
    li.querySelector('.btn-edit').addEventListener('click', () => openEditModal(index));

    // Delete
    li.querySelector('.btn-danger').addEventListener('click', () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
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

renderTodos();

// ── Edit Modal ────────────────────────────────────────────────
const editModal    = document.getElementById('editModal');
const editInput    = document.getElementById('editInput');
const saveEditBtn  = document.getElementById('saveEditBtn');
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
  todos[editingIndex].text = text;
  saveTodos();
  renderTodos();
  closeEditModal();
});

cancelEditBtn.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveEditBtn.click();
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
  } catch {
    return null;
  }
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

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    new URL(url); // validate
  } catch {
    linkUrlInput.style.borderColor = 'var(--danger)';
    setTimeout(() => linkUrlInput.style.borderColor = '', 1500);
    return;
  }

  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value = '';
  linkNameInput.focus();
}

addLinkBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});
linkNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkUrlInput.focus();
});

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
