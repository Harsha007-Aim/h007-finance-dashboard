# H007 Solutions — Personal Finance Dashboard

A modern, fully client-side personal finance dashboard for tracking income, expenses, budgets, payment cards, and savings goals.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-2E3A8C?style=for-the-badge&logo=github)](https://YOUR-USERNAME.github.io/h007-finance-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Dashboard Preview](screenshots/dashboard.png)

> Built with vanilla HTML, CSS & JavaScript. No frameworks. All data stored locally in the browser.

---

## Features

### Dashboard
- Total Balance, Income, Expenses & Savings cards with month-over-month % change
- Income bar chart (Fixed vs Variable income)
- Budget donut chart by category (Investment, Travel, Food, Entertainment, Healthcare)
- Recent transactions table
- Monthly spending limit progress bar
- Saved payment cards preview

### Transactions
- Full CRUD (Create, Read, Update, Delete)
- Search by name / ID / notes
- Filters: type, category, status, date range
- Status badges (Completed / Pending / Failed)

### Wallet
- Add, edit & delete payment cards
- Support for Visa, Mastercard, Amex
- Masked card numbers + custom themes

### Goals
- Create savings goals with target amount & deadline
- Progress tracking + contribute funds
- Mark goals as complete

### Analytics & Reports
- Spending trends over time
- Category breakdown
- Income vs Expenses comparison
- Monthly & yearly summary reports
- Export transactions to CSV

### Extra
- Dark / Light mode toggle
- Fully responsive
- Local storage persistence (data survives refresh)

---

## Tech Stack

| Technology       | Purpose                     |
|------------------|-----------------------------|
| HTML5 + CSS3     | Structure & styling         |
| Vanilla JS (ESM) | Application logic           |
| Chart.js         | Interactive charts          |
| Lucide Icons     | Clean icon set              |
| Inter font       | Typography                  |
| localStorage     | Data persistence            |

---

## Getting Started

### Option 1 — Open directly
Just open `index.html` in any modern browser.

### Option 2 — Local server (recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/h007-finance-dashboard.git
cd h007-finance-dashboard

# Python
python -m http.server 8080

# or Node.js
npx serve .
