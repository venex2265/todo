/* Persistence layer: everything lives in localStorage. */
(function () {
  const { daysFromToday } = TodoMe.utils;

  const DATA_KEY = 'todome:data';
  const THEME_KEY = 'todome:theme';

  // Demo content for first-time visitors; due dates are relative to today
  const createSeedData = () => ({
    name: 'Omar',
    focus: 0,
    tasks: [
      { id: 1, title: 'Finish the dashboard UI design', desc: 'Complete the new components for the analytics page', priority: 'High', due: daysFromToday(1), status: 'progress' },
      { id: 2, title: 'Review team pull requests', desc: 'Check and merge the latest updates', priority: 'Medium', due: daysFromToday(1), status: 'todo' },
      { id: 3, title: 'Prepare presentation', desc: 'For the client meeting next week', priority: 'High', due: daysFromToday(2), status: 'todo' },
      { id: 4, title: 'Update project documentation', desc: 'Add new features section', priority: 'Low', due: daysFromToday(3), status: 'todo' },
      { id: 5, title: 'Plan next sprint', desc: 'Discuss goals with the team', priority: 'Medium', due: daysFromToday(4), status: 'todo' },
      { id: 6, title: 'Fix responsive issue on mobile', desc: '', priority: 'Medium', due: daysFromToday(-1), status: 'done' },
    ],
    notes: [{ id: 1, text: 'Plan next week’s tasks', createdAt: Date.now() - 2 * 3600 * 1000 }],
  });

  const load = () => {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.warn('Could not read saved data, starting fresh.', error);
    }
    return createSeedData();
  };

  const save = (data) => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save data.', error);
    }
  };

  const getTheme = () => document.documentElement.dataset.theme;

  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* private mode */ }
  };

  TodoMe.storage = { load, save, getTheme, setTheme };
})();
