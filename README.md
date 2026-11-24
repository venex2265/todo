TodoMe

A task dashboard I built to keep my own days organised: tasks, a calendar, quick notes, a focus timer and a little analytics page, all in one screen. It's plain HTML, CSS and JavaScript, so there's nothing to install and nothing to build.

Live demo · screenshot

Drop a screenshot of the dashboard at assets/screenshot.png and it will show up here.

Why I made it

I wanted a project that goes beyond a static page but still stays simple enough to read from top to bottom. A to-do app turned out to be a good fit: it needs state, saving, filtering, a bit of date logic, and a layout that works on a phone as well as a wide monitor.

What it can do
Add, edit, delete and complete tasks, or mark them as in progress
Filter by status (pending, in progress, completed) and search by text
Pick a day on the calendar to see only that day's tasks; days with open tasks get a dot
Notifications for tasks that are due today or already late
Quick notes you can add and delete
A focus timer that adds up the time you spend working
An analytics page with bars for status, priority and overdue tasks
Light and dark theme, remembered between visits (it follows your device the first time)
Everything is saved in your browser, so your data is still there after a refresh
Responsive: on phones the sidebar turns into a bottom tab bar and the task rows stack
Built with
HTML5: semantic markup, a <dialog> for the task form, and one inline SVG sprite for all the icons
CSS3: custom properties for theming, Grid and Flexbox for layout, split into small files by job
JavaScript (ES6): no frameworks or libraries, just localStorage and the DOM
Inter from Google Fonts
Project structure
index.html          markup and the SVG icon sprite
css/
  variables.css     colours and sizes, light and dark theme
  base.css          reset and icon style
  layout.css        sidebar, header and grids
  components.css    buttons, cards, tasks, calendar, dialog
  responsive.css    breakpoints
js/
  utils.js          small helpers (dates, escaping, icons)
  storage.js        saving and loading
  ui.js             drawing each section of the page
  app.js            state, clicks and typing
assets/             favicon (and your screenshot)
How it works
app.js creates one state object, loaded from storage.js.
ui.js has one show...() function per section. They build HTML from state and never handle clicks.
When you do something, the click handler in app.js changes state, then saveAndRedraw() saves it and redraws the page.

The scripts share plain global functions on purpose, so a beginner doesn't have to chase imports. The load order in index.html matters.

Run it locally
bash
git clone https://github.com/venex2265/todo.git
cd todo

Then open index.html in your browser, or serve the folder with something like the VS Code Live Server extension.

Ideas for later
Drag and drop to reorder tasks
Recurring tasks
Export and import your data as JSON
Categories or labels
Built with Claude

I made this project together with Claude, Anthropic's AI assistant. I described what I wanted, Claude wrote the code, and we went back and forth on the design, the icons, the folder structure and making the code easy to read. I reviewed and tested the result, and I'm still learning from it.

License

Free to use and learn from. If you build on it, a star on the repo is always appreciated.
