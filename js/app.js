/* App entry: owns the state and wires up user events. */
(function () {
  const { $, $$, toISO, todayISO, formatFocus } = TodoMe.utils;
  const { storage, ui } = TodoMe;

  const ROUTES = ['dashboard', 'tasks', 'calendar', 'analytics', 'settings'];

  const state = {
    data: storage.load(),
    filter: 'all',
    query: '',
    selectedDate: null,
    visibleMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    openMenuId: null,
    editingId: null,
    focusRunning: false,
  };

  const findTask = (id) => state.data.tasks.find((task) => task.id === Number(id));

  // Save, then redraw. Use this after any change to state.data
  function commit() {
    storage.save(state.data);
    ui.renderAll(state);
  }

  /* ---------- Routing ---------- */
  function currentRoute() {
    const route = location.hash.slice(1);
    return ROUTES.includes(route) ? route : 'dashboard';
  }

  /* ---------- Task dialog ---------- */
  const dialog = $('#taskDialog');

  function openDialog(task = null) {
    state.editingId = task ? task.id : null;
    $('#dialogTitle').textContent = task ? 'Edit task' : 'New task';
    $('#taskTitle').value = task ? task.title : '';
    $('#taskDesc').value = task ? task.desc : '';
    $('#taskPriority').value = task ? task.priority : 'Medium';
    $('#taskDue').value = task ? task.due : state.selectedDate || todayISO();
    dialog.showModal();
    $('#taskTitle').focus();
  }

  $('#taskForm').addEventListener('submit', () => {
    const values = {
      title: $('#taskTitle').value.trim(),
      desc: $('#taskDesc').value.trim(),
      priority: $('#taskPriority').value,
      due: $('#taskDue').value,
    };
    if (!values.title || !values.due) return;

    if (state.editingId) Object.assign(findTask(state.editingId), values);
    else state.data.tasks.push({ ...values, id: Date.now(), status: 'todo' });
    commit();
  });

  /* ---------- Notes ---------- */
  function addNote() {
    const input = $('#noteInput');
    const text = input.value.trim();
    if (!text) return;
    state.data.notes.push({ id: Date.now(), text, createdAt: Date.now() });
    input.value = '';
    commit();
  }

  /* ---------- Focus timer ---------- */
  let focusTicks = 0;
  setInterval(() => {
    if (!state.focusRunning) return;
    state.data.focus += 1;
    focusTicks += 1;
    const label = $('#focusValue');
    if (label) label.textContent = formatFocus(state.data.focus);
    if (focusTicks % 5 === 0) storage.save(state.data);
  }, 1000);

  /* ---------- Click actions (event delegation) ---------- */
  const actions = {
    'add-task': () => openDialog(),
    'close-dialog': () => dialog.close(),
    'toggle-task': ({ id }) => {
      const task = findTask(id);
      task.status = task.status === 'done' ? 'todo' : 'done';
      commit();
    },
    'start-task': ({ id }) => {
      const task = findTask(id);
      task.status = task.status === 'progress' ? 'todo' : 'progress';
      state.openMenuId = null;
      commit();
    },
    'edit-task': ({ id }) => { state.openMenuId = null; ui.renderTasks(state); openDialog(findTask(id)); },
    'delete-task': ({ id }) => {
      state.data.tasks = state.data.tasks.filter((task) => task.id !== Number(id));
      state.openMenuId = null;
      commit();
    },
    'task-menu': ({ id }) => {
      state.openMenuId = state.openMenuId === Number(id) ? null : Number(id);
      ui.renderTasks(state);
    },
    filter: ({ filter }) => { state.filter = filter; ui.renderTasks(state); },
    'pick-day': ({ date }) => {
      state.selectedDate = state.selectedDate === date ? null : date;
      // Clicking a greyed-out day jumps to its month
      const [year, month] = date.split('-').map(Number);
      if (month - 1 !== state.visibleMonth.getMonth()) state.visibleMonth = new Date(year, month - 1, 1);
      ui.renderCalendar(state);
      ui.renderTasks(state);
    },
    'clear-day': () => { state.selectedDate = null; ui.renderCalendar(state); ui.renderTasks(state); },
    'prev-month': () => { state.visibleMonth.setMonth(state.visibleMonth.getMonth() - 1); ui.renderCalendar(state); },
    'next-month': () => { state.visibleMonth.setMonth(state.visibleMonth.getMonth() + 1); ui.renderCalendar(state); },
    'add-note': addNote,
    'delete-note': ({ id }) => {
      state.data.notes = state.data.notes.filter((note) => note.id !== Number(id));
      commit();
    },
    'toggle-focus': () => { state.focusRunning = !state.focusRunning; ui.renderAll(state); },
    'reset-focus': () => { state.data.focus = 0; commit(); },
    'reset-all': () => {
      if (!confirm('Delete all tasks, notes and focus time? This can’t be undone.')) return;
      state.data.tasks = [];
      state.data.notes = [];
      state.data.focus = 0;
      commit();
    },
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');

    // Close open popups when clicking anywhere else
    if (!event.target.closest('.menu') && target?.dataset.action !== 'task-menu' && state.openMenuId !== null) {
      state.openMenuId = null;
      ui.renderTasks(state);
    }
    if (!event.target.closest('.notif')) $('#notifPanel').hidden = true;

    if (target && actions[target.dataset.action]) actions[target.dataset.action](target.dataset);
  });

  /* ---------- Header controls ---------- */
  $('#themeToggle').addEventListener('click', () => {
    storage.setTheme(storage.getTheme() === 'dark' ? 'light' : 'dark');
  });

  $('#notifToggle').addEventListener('click', () => {
    const panel = $('#notifPanel');
    panel.hidden = !panel.hidden;
    $('#notifToggle').setAttribute('aria-expanded', String(!panel.hidden));
  });

  $('#searchToggle').addEventListener('click', () => {
    const search = $('#search');
    const open = search.classList.toggle('is-open');
    if (open) {
      search.focus();
      if (currentRoute() !== 'tasks') location.hash = '#tasks';
    } else {
      search.value = '';
      state.query = '';
      ui.renderTasks(state);
    }
  });

  $('#search').addEventListener('input', (event) => { state.query = event.target.value; ui.renderTasks(state); });
  $('#noteInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') addNote(); });
  $('#nameInput').addEventListener('input', (event) => {
    state.data.name = event.target.value;
    storage.save(state.data);
    ui.renderHeader(state);
  });

  window.addEventListener('hashchange', () => ui.applyRoute(currentRoute()));

  /* ---------- Start ---------- */
  ui.renderAll(state);
  ui.applyRoute(currentRoute());
})();
