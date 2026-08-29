/**
 * H007 Solutions Personal Finance Dashboard - Dashboard View Controller
 */

import { store } from '../store.js';
import { chartManager } from '../charts.js';

export function renderDashboard() {
  const container = document.getElementById('dashboard-view');
  if (!container) return;

  const metrics = store.getMetrics();
  const txs = store.getTransactions();
  const cards = store.getCards();
  const user = store.getUser();
  const currency = user.currency || '$';

  // Calculate spending progress against monthly limit
  const currentMonthExpense = metrics.currentExpense;
  const spendingLimit = metrics.monthlySpendingLimit;
  const spendingPct = Math.min(Math.round((currentMonthExpense / spendingLimit) * 100), 100);
  let limitStatusClass = '';
  let limitStatusText = 'On track';
  if (currentMonthExpense > spendingLimit) {
    limitStatusClass = 'danger';
    limitStatusText = 'Limit Exceeded';
  } else if (spendingPct >= 80) {
    limitStatusClass = 'warning';
    limitStatusText = 'Near Limit';
  }

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Financial Overview</h1>
        <p>Welcome back, ${user.name}. Here's your real-time financial health summary.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="dashQuickAddTxBtn">
          <i data-lucide="plus"></i>
          <span>Add Transaction</span>
        </button>
      </div>
    </div>

    <!-- 4 Key Metrics Cards -->
    <div class="metric-grid">
      <!-- Card 1: Total Balance -->
      <div class="metric-card accent-balance">
        <div class="metric-card-top">
          <span class="metric-label">Total Balance</span>
          <div class="metric-icon-box blue">
            <i data-lucide="wallet"></i>
          </div>
        </div>
        <div class="metric-value">${currency}${metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer">
          <span class="trend-pill ${metrics.changes.balance.isPositive ? 'positive' : 'negative'}">
            <i data-lucide="${metrics.changes.balance.isPositive ? 'trending-up' : 'trending-down'}"></i>
            ${metrics.changes.balance.percent}%
          </span>
          <span class="trend-text">from last month</span>
        </div>
      </div>

      <!-- Card 2: Income -->
      <div class="metric-card accent-income">
        <div class="metric-card-top">
          <span class="metric-label">Monthly Income</span>
          <div class="metric-icon-box green">
            <i data-lucide="arrow-down-left"></i>
          </div>
        </div>
        <div class="metric-value">${currency}${metrics.currentIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer">
          <span class="trend-pill ${metrics.changes.income.isPositive ? 'positive' : 'negative'}">
            <i data-lucide="${metrics.changes.income.isPositive ? 'trending-up' : 'trending-down'}"></i>
            ${metrics.changes.income.percent}%
          </span>
          <span class="trend-text">vs previous month</span>
        </div>
      </div>

      <!-- Card 3: Expense -->
      <div class="metric-card accent-expense">
        <div class="metric-card-top">
          <span class="metric-label">Monthly Expense</span>
          <div class="metric-icon-box red">
            <i data-lucide="arrow-up-right"></i>
          </div>
        </div>
        <div class="metric-value">${currency}${metrics.currentExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer">
          <span class="trend-pill ${metrics.changes.expense.isPositive ? 'negative' : 'positive'}">
            <i data-lucide="${metrics.changes.expense.isPositive ? 'trending-up' : 'trending-down'}"></i>
            ${metrics.changes.expense.percent}%
          </span>
          <span class="trend-text">vs previous month</span>
        </div>
      </div>

      <!-- Card 4: Total Savings -->
      <div class="metric-card accent-savings">
        <div class="metric-card-top">
          <span class="metric-label">Total Savings</span>
          <div class="metric-icon-box purple">
            <i data-lucide="piggy-bank"></i>
          </div>
        </div>
        <div class="metric-value">${currency}${metrics.currentSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer">
          <span class="trend-pill ${metrics.changes.savings.isPositive ? 'positive' : 'negative'}">
            <i data-lucide="${metrics.changes.savings.isPositive ? 'trending-up' : 'trending-down'}"></i>
            ${metrics.changes.savings.percent}%
          </span>
          <span class="trend-text">net monthly savings</span>
        </div>
      </div>
    </div>

    <!-- Charts Section: Income Bar & Budget Donut -->
    <div class="charts-grid-2col">
      <!-- Income Chart -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Total Income</h3>
            <p>Fixed vs. Variable income comparison</p>
          </div>
          <div class="card-actions">
            <select id="incomePeriodSelector" class="form-select form-select-sm" style="width: 140px; padding: 6px 10px; font-size: 13px;">
              <option value="thisMonth">This Month</option>
              <option value="last3">Last 3 Months</option>
              <option value="last6" selected>Last 6 Months</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
        <div class="chart-container-relative">
          <canvas id="incomeBarChart"></canvas>
        </div>
      </div>

      <!-- Budget Donut Chart -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Budget Allocation</h3>
            <p>Spending across primary budget limits</p>
          </div>
          <div class="card-actions">
            <select id="budgetPeriodSelector" class="form-select form-select-sm" style="width: 130px; padding: 6px 10px; font-size: 13px;">
              <option value="thisMonth" selected>This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
        <div class="donut-chart-wrapper">
          <canvas id="budgetDonutChart"></canvas>
          <div class="donut-center-text">
            <div class="donut-center-label">Spent</div>
            <div class="donut-center-value" id="budgetCenterTotal">$0</div>
            <div class="donut-center-sub" id="budgetCenterSpent">of $0</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Dashboard: Recent Transactions Table & Side Widgets -->
    <div class="bottom-dashboard-grid">
      <!-- Recent Transactions Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Recent Transactions</h3>
            <p>Latest payment activity and receipts</p>
          </div>
          <div class="card-actions">
            <select id="recentTxFilter" class="form-select form-select-sm" style="width: 130px; padding: 6px 10px; font-size: 13px;">
              <option value="thisWeek">This Week</option>
              <option value="thisMonth" selected>This Month</option>
              <option value="all">All Time</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="seeAllTransactionsBtn">See all &rarr;</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table" id="recentTransactionsTable">
            <thead>
              <tr>
                <th>Recipient / Source</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody id="recentTransactionsBody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Side Widgets Stack -->
      <div class="side-widgets-stack">
        <!-- Spending Limits Widget -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>Monthly Spending Limit</h3>
              <p>Budget cap: ${currency}${spendingLimit.toLocaleString()}</p>
            </div>
            <span class="badge ${limitStatusClass ? 'badge-' + limitStatusClass : 'badge-completed'}">${limitStatusText}</span>
          </div>
          <div class="limit-tracker">
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600;">
              <span>${currency}${currentMonthExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })} spent</span>
              <span style="color: var(--text-muted);">${spendingPct}%</span>
            </div>
            <div class="limit-progress-bar-bg">
              <div class="limit-progress-bar-fill ${limitStatusClass}" style="width: ${spendingPct}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
              <span>${currency}0</span>
              <span>Remaining: ${currency}${Math.max(0, spendingLimit - currentMonthExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- My Cards Widget -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>My Cards</h3>
              <p>${cards.length} saved payment cards</p>
            </div>
            <button class="btn btn-ghost btn-sm" id="dashAddCardBtn">
              <i data-lucide="plus"></i>
              <span>Add</span>
            </button>
          </div>
          
          <div id="dashCardPreviewContainer">
            ${cards.length > 0 ? renderDashCardPreview(cards[0]) : '<p class="text-muted">No cards saved yet.</p>'}
          </div>
        </div>
      </div>
    </div>
  `;

  // Render recent transactions list
  renderRecentTransactionsList('thisMonth');

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Render Charts
  setTimeout(() => {
    chartManager.renderIncomeChart('incomeBarChart', 'last6');
    chartManager.renderBudgetDonutChart('budgetDonutChart', 'thisMonth');
  }, 50);

  // Attach event listeners
  document.getElementById('incomePeriodSelector')?.addEventListener('change', (e) => {
    chartManager.renderIncomeChart('incomeBarChart', e.target.value);
  });

  document.getElementById('budgetPeriodSelector')?.addEventListener('change', (e) => {
    chartManager.renderBudgetDonutChart('budgetDonutChart', e.target.value);
  });

  document.getElementById('recentTxFilter')?.addEventListener('change', (e) => {
    renderRecentTransactionsList(e.target.value);
  });

  document.getElementById('seeAllTransactionsBtn')?.addEventListener('click', () => {
    window.switchTab('transactions');
  });

  document.getElementById('dashQuickAddTxBtn')?.addEventListener('click', () => {
    window.openAddTransactionModal();
  });

  document.getElementById('dashAddCardBtn')?.addEventListener('click', () => {
    window.openAddCardModal();
  });
}

function renderDashCardPreview(card) {
  const skinClass = card.skin && card.skin !== 'default' ? `skin-${card.skin}` : '';
  const networkName = (card.cardType || 'visa').toUpperCase();
  return `
    <div class="credit-card-visual ${skinClass}" style="margin: 0 auto; max-width: 100%;">
      <div class="cc-top-row">
        <div class="cc-chip"></div>
        <div class="cc-contactless">
          <i data-lucide="wifi" style="width: 20px; height: 20px; transform: rotate(90deg);"></i>
        </div>
      </div>
      <div class="cc-number">${card.cardNumber || '•••• •••• •••• ' + card.last4}</div>
      <div class="cc-bottom-row">
        <div>
          <div class="cc-holder-label">Card Holder</div>
          <div class="cc-holder-name">${card.cardholderName || 'Alex Morgan'}</div>
        </div>
        <div>
          <div class="cc-expiry-label">Expires</div>
          <div class="cc-expiry-val">${card.expiryDate || '12/28'}</div>
        </div>
        <div class="cc-network-logo">${networkName}</div>
      </div>
    </div>
  `;
}

function renderRecentTransactionsList(filterPeriod = 'thisMonth') {
  const tbody = document.getElementById('recentTransactionsBody');
  if (!tbody) return;

  const allTxs = store.getTransactions();
  const now = new Date();
  const user = store.getUser();
  const currency = user.currency || '$';

  let filtered = allTxs.filter(t => {
    if (filterPeriod === 'thisWeek') {
      const oneWeekAgo = Date.now() - (7 * 86400000);
      return new Date(t.date).getTime() >= oneWeekAgo;
    } else if (filterPeriod === 'thisMonth') {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true; // all
  });

  const recentItems = filtered.slice(0, 7);

  if (recentItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No transactions found for this period.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recentItems.map(t => {
    const initials = (t.recipientName || 'H7')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const isIncome = t.type === 'income';
    const amountFormatted = `${isIncome ? '+' : '-'}${currency}${t.amount.toFixed(2)}`;
    const amountClass = isIncome ? 'amount-positive' : 'amount-negative';

    const dateStr = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeStr = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let statusBadgeClass = 'badge-completed';
    if (t.status === 'pending') statusBadgeClass = 'badge-pending';
    else if (t.status === 'failed') statusBadgeClass = 'badge-failed';

    return `
      <tr>
        <td>
          <div class="entity-cell">
            <div class="entity-avatar">${initials}</div>
            <div class="entity-details">
              <span class="entity-name">${t.recipientName}</span>
              <span class="entity-sub">${t.category}</span>
            </div>
          </div>
        </td>
        <td><code style="font-size: 11px; background: var(--bg-surface-subtle); padding: 2px 6px; border-radius: 4px;">#${t.id.slice(-6).toUpperCase()}</code></td>
        <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
        <td><span style="font-size: 12px; color: var(--text-secondary);">${dateStr} • ${timeStr}</span></td>
        <td style="text-align: right;"><span class="${amountClass}">${amountFormatted}</span></td>
      </tr>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
