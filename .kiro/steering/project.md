# Project: To-Do List Dashboard

## Overview
A vanilla HTML/CSS/JavaScript to-do list dashboard. No frameworks, no backend, no build tools.
All data is stored client-side using the browser's LocalStorage API.

## Tech Stack
- HTML5
- CSS3 (CSS custom properties for theming)
- Vanilla JavaScript (ES6+)
- LocalStorage for persistence

## File Structure
- `index.html` — app structure and markup
- `style.css` — all styles including light/dark theme variables
- `app.js` — all application logic

## Features
- Greeting with current time, date, and optional custom user name
- Light / Dark mode toggle (saved to LocalStorage)
- Focus Timer (Pomodoro) with configurable duration (1–120 min)
- To-Do List: add, edit, delete, mark done, prevent duplicates, sort tasks
- Quick Links: add/remove favorite URLs with favicons, saved to LocalStorage

## Coding Conventions
- No external libraries or frameworks
- Keep all JS in `app.js`, all styles in `style.css`
- Use `store.get` / `store.set` helpers for all LocalStorage access
- Escape user input with `escapeHtml()` before inserting into the DOM
- Use CSS custom properties (`var(--...)`) for all colors and spacing — never hardcode values
- Prefer `const` and `let`, no `var`
- Event listeners attached in JS, no inline `onclick` in HTML
