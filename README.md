# Expense Tracker with Insights

A fast, production-ready personal finance tracker that explains your spending behavior instead of just showing numbers. Built with **Vanilla JS**, **HTML5**, **CSS3**, and **IndexedDB**.



## Features

- **Automated Insights**: "Food spending increased 27% compared to last month."
- **Instant Tracking**: Add income/expenses with zero latency.
- **Privacy First**: All data is stored locally in your browser (IndexedDB). No servers, no tracking.
- **Visual Analytics**: Interactive bar charts and real-time balance updates.
- **Export Ready**: Download your data as CSV or generate a printable PDF report.

## Quick Start

1. **Open**: Double-click the `index.html` file in this folder.
2. **Log In**: Use any email (e.g., `user@example.com`). The system will automatically create an account if it doesn't exist.
3. **Track**: Start adding transactions!

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6)
- **Database**: IndexedDB (Native browser database)
- **Charts**: Custom HTML5 Canvas implementation (Zero dependencies)

## Project Structure

```
/
├── index.html          # Main application entry
├── screenshot.png      # Preview image
└── assets/
    ├── css/
    │   └── style.css   # Mobile-first styles
    └── js/
        ├── app.js      # Main controller
        ├── db.js       # Database wrapper
        ├── insights.js # Analysis engine
        ├── transactions.js # Business logic
        └── ui.js       # Rendering logic
```
