/* Rendering: turns the app state into DOM. No event handling happens here. */
(function () {
  const { $, $$, escapeHTML, toISO, todayISO, formatDate, formatFocus, timeAgo, icon } = TodoMe.utils;

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'todo', label: 'Pending' },
    { key: 'progress', label: 'In progress' },
    { key: 'done', label: 'Completed' },
  ];

  const countBy = (tasks, status) => tasks.filter((task) => task.status === status).length;

  /* Which tasks should the list show right now? */
  function getVisibleTasks({ data, filter, query, selectedDate }) {
    const search = query.trim().toLowerCase();
    return data.tasks
      .filter((task) => filter === 'all' || task.status === filter)
      .filter((task) => !selectedDate || task.due === selectedDate)
      .filter((task) => !search || `${task.title} ${task.desc}`.toLowerCase().includes(search))
      .sort((a, b) => (a.status === 'done') - (b.status === 'done') || a.due.localeCompare(b.due));
  }

  function renderHeader({ data }) {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    $('#greeting').textContent = `Good ${part}, ${data.name || 'there'} 👋`;
    $('#today').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    $('#avatar').textContent = (data.name || '?').trim().charAt(0).toUpperCase();

    const today = todayISO();
    const attention = data.tasks.filter((task) => task.status !== 'done' && task.due <= today);
    $('#notifCount').textContent = attention.length || '';
    $('#notifPanel').innerHTML = attention.length
      ? attention.map((task) => `
          <div><strong>${escapeHTML(task.title)}</strong>
          <small>${task.due < today ? 'Overdue since' : 'Due today,'} ${formatDate(task.due)}</small></div>`).join('')
      : '<div>You’re all caught up.</div>';
  }

  function renderStats({ data, focusRunning }) {
    const { tasks } = data;
    const done = countBy(tasks, 'done');
    const dueToday = tasks.filter((task) => task.due === todayISO() && task.status !== 'done').length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const cards = [
      { icon: 'list', tone: 'blue', value: tasks.length, label: `Total tasks · ${tasks.length - done} to do` },
      { icon: 'check-circle', tone: 'green', value: done, label: `Completed · ${percent}%` },
      { icon: 'calendar', tone: 'amber', value: dueToday, label: 'Due today' },
      { icon: 'clock', tone: 'rose', value: formatFocus(data.focus), label: 'Focus time', focus: true },
    ];

    $('#stats').innerHTML = cards.map((card) => `
      <article class="card stat">
        <span class="stat__icon stat__icon--${card.tone}">${icon(card.icon)}</span>
        <div>
          <strong class="stat__value"${card.focus ? ' id="focusValue"' : ''}>${card.value}</strong>
          <span class="stat__label">${card.label}</span>
          ${card.focus ? `<button class="stat__btn" type="button" data-action="toggle-focus">${focusRunning ? 'Pause' : 'Start focus'}</button>` : ''}
        </div>
      </article>`).join('');

    $('#progressBar').style.width = `${percent}%`;
    $('#progressText').textContent = `${done} of ${tasks.length} tasks done`;
  }

  function renderTaskRow(task, openMenuId) {
    const isDone = task.status === 'done';
    const overdue = !isDone && task.due < todayISO();
    const pill = isDone ? '<span class="pill pill--done">Completed</span>'
      : task.status === 'progress' ? '<span class="pill pill--progress">In progress</span>'
      : `<span class="pill pill--${task.priority}">${task.priority}</span>`;

    return `
      <div class="task ${isDone ? 'is-done' : ''} ${task.status === 'progress' ? 'is-progress' : ''}">
        <button class="task__check" type="button" data-action="toggle-task" data-id="${task.id}" aria-label="${isDone ? 'Mark as pending' : 'Mark as completed'}">${isDone ? icon('check') : ''}</button>
        <div>
          <strong class="task__title">${escapeHTML(task.title)}</strong>
          ${task.desc ? `<span class="task__desc">${escapeHTML(task.desc)}</span>` : ''}
        </div>
        ${pill}
        <span class="task__date ${overdue ? 'is-overdue' : ''}">${icon('calendar')}${formatDate(task.due)}</span>
        <button class="task__more" type="button" data-action="task-menu" data-id="${task.id}" aria-label="Task options" aria-expanded="${openMenuId === task.id}">${icon('dots')}</button>
        ${openMenuId === task.id ? `
          <div class="menu">
            <button type="button" data-action="edit-task" data-id="${task.id}">Edit</button>
            <button type="button" data-action="start-task" data-id="${task.id}">${task.status === 'progress' ? 'Move to pending' : 'Start working'}</button>
            <button type="button" data-action="delete-task" data-id="${task.id}">Delete</button>
          </div>` : ''}
      </div>`;
  }

  function renderTasks(state) {
    const { data, filter, selectedDate, openMenuId } = state;

    $('#tabs').innerHTML = FILTERS.map(({ key, label }) => {
      const count = key === 'all' ? data.tasks.length : countBy(data.tasks, key);
      return `<button class="tab ${filter === key ? 'is-active' : ''}" type="button" data-action="filter" data-filter="${key}">${label} (${count})</button>`;
    }).join('');

    $('#dayFilter').innerHTML = selectedDate
      ? `<span class="chip">${formatDate(selectedDate)}<button type="button" data-action="clear-day" aria-label="Clear date filter">${icon('x')}</button></span>`
      : '';

    const visible = getVisibleTasks(state);
    $('#taskList').innerHTML = visible.length
      ? visible.map((task) => renderTaskRow(task, openMenuId)).join('')
      : `<div class="empty">${data.tasks.length ? 'No tasks match. Try another filter.' : 'No tasks yet. Add your first task.'}</div>`;
  }

  function renderCalendar({ data, visibleMonth, selectedDate }) {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const today = todayISO();
    const withTasks = new Set(data.tasks.filter((task) => task.status !== 'done').map((task) => task.due));

    $('#monthTitle').textContent = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Always draw 6 weeks so the grid height never jumps between months
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => `<span class="calendar__weekday">${day}</span>`);

    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = toISO(date);
      const classes = [
        'calendar__day',
        date.getMonth() !== month && 'is-other',
        iso === today && 'is-today',
        iso === selectedDate && 'is-selected',
        withTasks.has(iso) && 'has-tasks',
      ].filter(Boolean).join(' ');
      return `<button class="${classes}" type="button" data-action="pick-day" data-date="${iso}" aria-label="${formatDate(iso)}">${date.getDate()}</button>`;
    });

    $('#calendar').innerHTML = weekdays.concat(days).join('');
  }

  function renderNotes({ data }) {
    $('#noteList').innerHTML = data.notes.length
      ? [...data.notes].reverse().map((note) => `
          <div class="note">
            <div>${escapeHTML(note.text)}<small>${timeAgo(note.createdAt)}</small></div>
            <button type="button" data-action="delete-note" data-id="${note.id}" aria-label="Delete note">${icon('x')}</button>
          </div>`).join('')
      : '<div class="empty">No notes yet.</div>';
  }

  function renderAnalytics({ data }) {
    const { tasks } = data;
    const total = tasks.length || 1;
    const row = (label, count) => `
      <div class="bar-row"><span>${label}</span><div class="meter"><span style="width:${Math.round((count / total) * 100)}%"></span></div><b>${count}</b></div>`;
    const byPriority = (level) => tasks.filter((task) => task.priority === level).length;
    const overdue = tasks.filter((task) => task.status !== 'done' && task.due < todayISO()).length;

    $('#analytics').innerHTML = `
      <div class="analytics">
        <p class="analytics__summary">Completion rate <b>${Math.round((countBy(tasks, 'done') / total) * 100)}%</b> · Focus time <b>${formatFocus(data.focus)}</b></p>
        <h3>By status</h3>
        ${row('Pending', countBy(tasks, 'todo'))}${row('In progress', countBy(tasks, 'progress'))}${row('Completed', countBy(tasks, 'done'))}
        <h3>By priority</h3>
        ${row('High', byPriority('High'))}${row('Medium', byPriority('Medium'))}${row('Low', byPriority('Low'))}
        <h3>Needs attention</h3>
        ${row('Overdue', overdue)}
      </div>`;
  }

  // Shows only the sections that belong to the current route
  function applyRoute(route) {
    $('#app').dataset.route = route;
    $$('[data-views]').forEach((section) => {
      section.hidden = !section.dataset.views.split(' ').includes(route);
    });
    $$('.nav__link').forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function renderAll(state) {
    renderHeader(state);
    renderStats(state);
    renderTasks(state);
    renderCalendar(state);
    renderNotes(state);
    renderAnalytics(state);
    $('#nameInput').value = state.data.name;
  }

  TodoMe.ui = { renderAll, renderTasks, renderCalendar, renderHeader, applyRoute };
})();
