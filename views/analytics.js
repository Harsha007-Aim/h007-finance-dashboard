/**
 * H007 Solutions Personal Finance Dashboard - Analytics View Controller
 */

import { store } from '../store.js';
import { chartManager } from '../charts.js';

export function renderAnalyticsView() {
  const container = document.getElementById('analytics-view');
  if (!container) return;

  const user = store.getUser();
  const currency = user.currency || '$';
  const txs = store.getTransactions().filter(t => t.type === 'expense' && t.status !== 'failed');

  // Calculate top spending categories breakdown
  const catTotals = {};
  let totalExpenseAll = 0;
  txs.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    totalExpenseAll += t.amount;
  });

  const rankedCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1]);

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Financial Analytics</h1>
        <p>In-depth spending trends, cash flow distributions, and expense analysis.</p>
      </div>
    </div>

    <!-- Spending Trends Section (Line Chart) -->
    <div class="card" style="margin-bottom: var(--spacing-xl);">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Spending Trends</h3>
          <p>Expenditure pattern compared to prior period</p>
        </div>
        <div class="card-actions">
          <select id="trendsPeriodSelect" class="form-select form-select-sm" style="width: 130px; padding: 6px 10px; font-size: 13px;">
            <option value="weekly">Weekly</option>
            <option value="monthly" selected>Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      <div class="chart-container-relative" style="height: 300px;">
        <canvas id="spendingTrendsChart"></canvas>
      </div>
    </div>

    <!-- 2 Column Analytics: Category Breakdown & Income vs Expense -->
    <div class="charts-grid-2col">
      <!-- Category Breakdown Chart & Ranking -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Category Breakdown</h3>
            <p>Spending distribution across categories</p>
          </div>
        </div>
        <div class="chart-container-relative" style="height: 240px; margin-bottom: var(--spacing-md);">
          <canvas id="categoryBreakdownChart"></canvas>
        </div>

        <!-- Ranked Category List -->
        <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          ${rankedCats.slice(0, 4).map(([cat, amt]) => {
    const pct = totalExpenseAll > 0 ? Math.round((amt / totalExpenseAll) * 100) : 0;
    return `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
                <span style="font-weight: 500; color: var(--text-primary);">${cat}</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: var(--text-muted); font-size: 12px;">${pct}%</span>
                  <strong style="color: var(--text-primary);">${currency}${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      </div>

      <!-- Income vs Expense Bar Comparison -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Income vs Expenses</h3>
            <p>Monthly cashflow comparison and net savings</p>
          </div>
        </div>
        <div class="chart-container-relative" style="height: 320px;">
          <canvas id="incomeVsExpenseChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Top Individual Expenses Table -->
    <div class="card" style="margin-top: var(--spacing-xl);">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Top Individual Expenses</h3>
          <p>Highest expenditure items on record</p>
        </div>
        <div class="card-actions">
          <select id="topExpensesPeriodSelect" class="form-select form-select-sm" style="width: 140px; padding: 6px 10px; font-size: 13px;">
            <option value="all" selected>All Time</option>
            <option value="thisMonth">This Month</option>
            <option value="last3">Last 3 Months</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Recipient / Merchant</th>
              <th>Category</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody id="topExpensesTableBody">
            <!-- Rendered by updateTopExpenses() -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    chartManager.renderSpendingTrendsChart('spendingTrendsChart', 'monthly');
    chartManager.renderCategoryBreakdownChart('categoryBreakdownChart');
    chartManager.renderIncomeVsExpenseChart('incomeVsExpenseChart');
  }, 50);

  updateTopExpensesList('all');

  document.getElementById('trendsPeriodSelect')?.addEventListener('change', (e) => {
    chartManager.renderSpendingTrendsChart('spendingTrendsChart', e.target.value);
  });

  document.getElementById('topExpensesPeriodSelect')?.addEventListener('change', (e) => {
    updateTopExpensesList(e.target.value);
  });
}

function updateTopExpensesList(period = 'all') {
  const tbody = document.getElementById('topExpensesTableBody');
  if (!tbody) return;

  const now = new Date();
  let txs = store.getTransactions().filter(t => t.type === 'expense' && t.status !== 'failed');

  if (period === 'thisMonth') {
    txs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  } else if (period === 'last3') {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
    txs = txs.filter(t => new Date(t.date).getTime() >= threeMonthsAgo);
  }

  const topItems = txs.sort((a, b) => b.amount - a.amount).slice(0, 6);
  const user = store.getUser();
  const currency = user.currency || '$';

  if (topItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No expense transactions found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = topItems.map((t, idx) => {
    const initials = (t.recipientName || 'H7')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const dateStr = new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return `
      <tr>
        <td>
          <span style="font-weight: 700; color: var(--jm-dark-blue); font-size: 13px;">#${idx + 1}</span>
        </td>
        <td>
          <div class="entity-cell">
            <div class="entity-avatar">${initials}</div>
            <div class="entity-details">
              <span class="entity-name">${t.recipientName}</span>
              ${t.notes ? `<span class="entity-sub">${t.notes}</span>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${t.category}</span></td>
        <td><span style="font-size: 12px; color: var(--text-secondary);">${dateStr}</span></td>
        <td style="text-align: right;"><strong style="color: var(--text-primary); font-size: 14px;">${currency}${t.amount.toFixed(2)}</strong></td>
      </tr>
    `;
  }).join('');
}
