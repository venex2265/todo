/* Small, dependency-free helpers shared by the other scripts. */
(function () {
  const TodoMe = (window.TodoMe = window.TodoMe || {});

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Always escape user text before putting it into innerHTML
  const escapeHTML = (text) =>
    String(text).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);

  // Dates are stored as local "YYYY-MM-DD" strings so they sort and compare easily
  const toISO = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const todayISO = () => toISO(new Date());

  const daysFromToday = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return toISO(date);
  };

  const formatDate = (iso) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatFocus = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
  };

  const timeAgo = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
  };

  // References a symbol from the sprite in index.html
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  TodoMe.utils = { $, $$, escapeHTML, toISO, todayISO, daysFromToday, formatDate, formatFocus, timeAgo, icon };
})();
