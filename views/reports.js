/**
 * H007 Solutions Personal Finance Dashboard - Reports View Controller
 */

import { store } from '../store.js';
import { exportTransactionsCSV, printFinancialReport } from '../export.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function renderReportsView() {
  const container = document.getElementById('reports-view');
  if (!container) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Financial Reports & Summaries</h1>
        <p>Comprehensive monthly statements, yearly audits, and ledger exports.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="printReportBtn">
          <i data-lucide="printer"></i>
          <span>Print / PDF</span>
        </button>
        <button class="btn btn-primary" id="exportFullCsvBtn">
          <i data-lucide="download"></i>
          <span>Export All Data (CSV)</span>
        </button>
      </div>
    </div>

    <!-- Report Mode Selector -->
    <div class="card" style="margin-bottom: var(--spacing-xl); padding: var(--spacing-md);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-md);">
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm report-tab-btn active" id="monthlyReportTabBtn">Monthly Statement</button>
          <button class="btn btn-ghost btn-sm report-tab-btn" id="yearlyReportTabBtn">Yearly Audit Matrix</button>
        </div>

        <div id="reportControlsContainer" style="display: flex; align-items: center; gap: 8px;">
          <!-- Controls rendered dynamically for Monthly or Yearly -->
        </div>
      </div>
    </div>

    <!-- Report Body Container -->
    <div id="reportContentContainer">
      <!-- Injected by renderMonthlyReport() or renderYearlyReport() -->
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Setup initial monthly view
  setupMonthlyReportControls();
  renderMonthlyReport(currentYear, currentMonth);

  // Setup tab switches
  document.getElementById('monthlyReportTabBtn')?.addEventListener('click', (e) => {
    document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
    document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.add('btn-ghost'));
    e.currentTarget.classList.add('active', 'btn-primary');
    e.currentTarget.classList.remove('btn-ghost');
    setupMonthlyReportControls();
    renderMonthlyReport(new Date().getFullYear(), new Date().getMonth());
  });

  document.getElementById('yearlyReportTabBtn')?.addEventListener('click', (e) => {
    document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
    document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.add('btn-ghost'));
    e.currentTarget.classList.add('active', 'btn-primary');
    e.currentTarget.classList.remove('btn-ghost');
    setupYearlyReportControls();
    renderYearlyReport(new Date().getFullYear());
  });

  document.getElementById('printReportBtn')?.addEventListener('click', () => {
    printFinancialReport();
  });

  document.getElementById('exportFullCsvBtn')?.addEventListener('click', () => {
    exportTransactionsCSV();
  });
}

function setupMonthlyReportControls() {
  const container = document.getElementById('reportControlsContainer');
  if (!container) return;

  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  container.innerHTML = `
    <select id="reportMonthSelect" class="form-select" style="width: 140px; padding: 6px 12px; font-size: 13px;">
      ${MONTH_NAMES.map((m, idx) => `<option value="${idx}" ${idx === now.getMonth() ? 'selected' : ''}>${m}</option>`).join('')}
    </select>
    <select id="reportYearSelect" class="form-select" style="width: 110px; padding: 6px 12px; font-size: 13px;">
      ${years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
    </select>
  `;

  const onChange = () => {
    const m = parseInt(document.getElementById('reportMonthSelect').value, 10);
    const y = parseInt(document.getElementById('reportYearSelect').value, 10);
    renderMonthlyReport(y, m);
  };

  document.getElementById('reportMonthSelect')?.addEventListener('change', onChange);
  document.getElementById('reportYearSelect')?.addEventListener('change', onChange);
}

function renderMonthlyReport(year, month) {
  const container = document.getElementById('reportContentContainer');
  if (!container) return;

  const txs = store.getTransactions().filter(t => t.status !== 'failed');
  const user = store.getUser();
  const currency = user.currency || '$';

  const monthTxs = txs.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category breakdown
  const catBreakdown = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
  });

  const sortedCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  container.innerHTML = `
    <div class="card" id="printableReportSection">
      <!-- Report Header -->
      <div style="border-bottom: 2px solid var(--jm-dark-blue); padding-bottom: var(--spacing-lg); margin-bottom: var(--spacing-xl); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 14px; height: 14px; background: var(--jm-dark-blue); border-radius: 3px;"></div>
            <strong style="color: var(--jm-dark-blue); letter-spacing: 1px; font-size: 13px;">H007 SOLUTIONS FINANCIAL STATEMENT</strong>
          </div>
          <h2 style="font-size: 1.85rem; margin-top: 6px;">Monthly Performance: ${MONTH_NAMES[month]} ${year}</h2>
          <p style="font-size: 13px; color: var(--text-muted);">Account Holder: <strong>${user.name}</strong> (${user.email})</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; color: var(--text-muted); display: block;">Statement Date</span>
          <strong style="font-size: 14px; color: var(--text-primary);">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </div>
      </div>

      <!-- Key Summary Cards -->
      <div class="metric-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--spacing-xl);">
        <div class="metric-card accent-income">
          <span class="metric-label">Total Income</span>
          <div class="metric-value">${currency}${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div class="metric-footer"><span class="trend-text">${monthTxs.filter(t => t.type === 'income').length} credit events</span></div>
        </div>

        <div class="metric-card accent-expense">
          <span class="metric-label">Total Expenses</span>
          <div class="metric-value">${currency}${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div class="metric-footer"><span class="trend-text">${monthTxs.filter(t => t.type === 'expense').length} debit events</span></div>
        </div>

        <div class="metric-card accent-savings">
          <span class="metric-label">Net Savings</span>
          <div class="metric-value" style="color: ${netSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
            ${currency}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div class="metric-footer"><span class="trend-text">${savingsRate}% savings rate</span></div>
        </div>

        <div class="metric-card">
          <span class="metric-label">Total Transactions</span>
          <div class="metric-value">${monthTxs.length}</div>
          <div class="metric-footer"><span class="trend-text">Processed in period</span></div>
        </div>
      </div>

      <!-- Categories & Transactions Breakdown -->
      <div class="charts-grid-2col" style="margin-bottom: var(--spacing-xl);">
        <!-- Top Spending Categories -->
        <div>
          <h3 style="font-size: 1.15rem; margin-bottom: 12px;">Top Spending Categories</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${sortedCats.length === 0 ? '<p style="color: var(--text-muted); font-size: 13px;">No expense records for this month.</p>' : ''}
            ${sortedCats.map(([cat, amt]) => {
    const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
    return `
                <div style="background: var(--bg-surface-subtle); padding: 10px 14px; border-radius: var(--radius-btn); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 500; font-size: 13px;">${cat}</span>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: var(--text-muted); font-size: 12px;">${pct}%</span>
                    <strong style="color: var(--text-primary); font-size: 13px;">${currency}${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        </div>

        <!-- Month Transaction Summary Log -->
        <div>
          <h3 style="font-size: 1.15rem; margin-bottom: 12px;">Period Transactions Log (${monthTxs.length})</h3>
          <div style="max-height: 260px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-btn);">
            <table class="data-table">
              <tbody>
                ${monthTxs.length === 0 ? '<tr><td style="text-align: center; color: var(--text-muted); padding: 24px;">No transactions recorded for this month.</td></tr>' : ''}
                ${monthTxs.map(t => `
                  <tr>
                    <td>
                      <strong style="font-size: 13px;">${t.recipientName}</strong>
                      <span style="display: block; font-size: 11px; color: var(--text-muted);">${new Date(t.date).toLocaleDateString()} • ${t.category}</span>
                    </td>
                    <td style="text-align: right;">
                      <span style="font-weight: 700; color: ${t.type === 'income' ? 'var(--color-success)' : 'var(--text-primary)'};">
                        ${t.type === 'income' ? '+' : '-'}${currency}${t.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupYearlyReportControls() {
  const container = document.getElementById('reportControlsContainer');
  if (!container) return;

  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  container.innerHTML = `
    <select id="yearlyReportYearSelect" class="form-select" style="width: 140px; padding: 6px 12px; font-size: 13px;">
      ${years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y} Annual Audit</option>`).join('')}
    </select>
  `;

  document.getElementById('yearlyReportYearSelect')?.addEventListener('change', (e) => {
    renderYearlyReport(parseInt(e.target.value, 10));
  });
}

function renderYearlyReport(year) {
  const container = document.getElementById('reportContentContainer');
  if (!container) return;

  const txs = store.getTransactions().filter(t => t.status !== 'failed');
  const user = store.getUser();
  const currency = user.currency || '$';

  let annualIncome = 0;
  let annualExpense = 0;

  const monthlyRows = MONTH_NAMES.map((mName, mIdx) => {
    const monthTxs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === mIdx;
    });

    const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const sav = inc - exp;

    annualIncome += inc;
    annualExpense += exp;

    return {
      month: mName,
      income: inc,
      expense: exp,
      savings: sav,
      count: monthTxs.length
    };
  });

  const annualSavings = annualIncome - annualExpense;

  container.innerHTML = `
    <div class="card" id="printableReportSection">
      <!-- Report Header -->
      <div style="border-bottom: 2px solid var(--jm-dark-blue); padding-bottom: var(--spacing-lg); margin-bottom: var(--spacing-xl); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 14px; height: 14px; background: var(--jm-dark-blue); border-radius: 3px;"></div>
            <strong style="color: var(--jm-dark-blue); letter-spacing: 1px; font-size: 13px;">H007 SOLUTIONS ANNUAL AUDIT</strong>
          </div>
          <h2 style="font-size: 1.85rem; margin-top: 6px;">Yearly Financial Performance: ${year}</h2>
          <p style="font-size: 13px; color: var(--text-muted);">12-Month Consolidated Ledger for <strong>${user.name}</strong></p>
        </div>
      </div>

      <!-- Annual Totals Summary -->
      <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--spacing-xl);">
        <div class="metric-card accent-income">
          <span class="metric-label">Annual Gross Income</span>
          <div class="metric-value">${currency}${annualIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="metric-card accent-expense">
          <span class="metric-label">Annual Total Expenses</span>
          <div class="metric-value">${currency}${annualExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="metric-card accent-savings">
          <span class="metric-label">Annual Net Savings</span>
          <div class="metric-value" style="color: ${annualSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
            ${currency}${annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <!-- 12-Month Table Breakdown -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th style="text-align: right;">Gross Income</th>
              <th style="text-align: right;">Total Expense</th>
              <th style="text-align: right;">Net Savings</th>
              <th style="text-align: center;">Transactions</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyRows.map(r => `
              <tr>
                <td><strong>${r.month} ${year}</strong></td>
                <td style="text-align: right; color: var(--color-success); font-weight: 600;">+${currency}${r.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; color: var(--text-primary); font-weight: 600;">-${currency}${r.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 700; color: ${r.savings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
                  ${currency}${r.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style="text-align: center;"><span class="badge badge-category">${r.count}</span></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: var(--bg-surface-subtle); font-weight: 700; border-top: 2px solid var(--border-color);">
              <td style="padding: 14px 16px;">ANNUAL TOTAL</td>
              <td style="text-align: right; color: var(--color-success); padding: 14px 16px;">+${currency}${annualIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right; color: var(--text-primary); padding: 14px 16px;">-${currency}${annualExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right; color: ${annualSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}; padding: 14px 16px;">${currency}${annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style="text-align: center; padding: 14px 16px;">${monthlyRows.reduce((a, b) => a + b.count, 0)} Total</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}
