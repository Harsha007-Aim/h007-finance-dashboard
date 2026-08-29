/**
 * H007 Solutions Personal Finance Dashboard - Transactions View Controller
 */

import { store, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../store.js';

let currentPage = 1;
const ITEMS_PER_PAGE = 8;
let currentFilters = {
  search: '',
  type: 'all',
  category: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'date-desc'
};

export function renderTransactionsView() {
  const container = document.getElementById('transactions-view');
  if (!container) return;

  const allCategories = [
    ...DEFAULT_INCOME_CATEGORIES.map(c => ({ name: c.name, type: 'Income' })),
    ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ name: c.name, type: 'Expense' }))
  ];

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Transaction History</h1>
        <p>Comprehensive ledger of all your income, expenses, and payments.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="exportTxBtn">
          <i data-lucide="download"></i>
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary" id="addTxBtn">
          <i data-lucide="plus"></i>
          <span>Add Transaction</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="card" style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md);">
      <div class="filter-bar">
        <!-- Search -->
        <div style="position: relative; flex: 1; min-width: 220px;">
          <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);"></i>
          <input type="text" id="txSearchInput" class="form-control" placeholder="Search by recipient, ID, or notes..." style="padding-left: 36px;" value="${currentFilters.search}">
        </div>

        <!-- Filter Controls -->
        <div class="filter-group">
          <!-- Type Filter -->
          <select id="txTypeFilter" class="form-select" style="width: 120px;">
            <option value="all" ${currentFilters.type === 'all' ? 'selected' : ''}>All Types</option>
            <option value="income" ${currentFilters.type === 'income' ? 'selected' : ''}>Income</option>
            <option value="expense" ${currentFilters.type === 'expense' ? 'selected' : ''}>Expense</option>
          </select>

          <!-- Category Filter -->
          <select id="txCategoryFilter" class="form-select" style="width: 150px;">
            <option value="all">All Categories</option>
            ${allCategories.map(c => `<option value="${c.name}" ${currentFilters.category === c.name ? 'selected' : ''}>${c.name} (${c.type})</option>`).join('')}
          </select>

          <!-- Status Filter -->
          <select id="txStatusFilter" class="form-select" style="width: 130px;">
            <option value="all" ${currentFilters.status === 'all' ? 'selected' : ''}>All Status</option>
            <option value="completed" ${currentFilters.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="pending" ${currentFilters.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="failed" ${currentFilters.status === 'failed' ? 'selected' : ''}>Failed</option>
          </select>

          <!-- Sort Filter -->
          <select id="txSortFilter" class="form-select" style="width: 140px;">
            <option value="date-desc" ${currentFilters.sortBy === 'date-desc' ? 'selected' : ''}>Newest First</option>
            <option value="date-asc" ${currentFilters.sortBy === 'date-asc' ? 'selected' : ''}>Oldest First</option>
            <option value="amount-desc" ${currentFilters.sortBy === 'amount-desc' ? 'selected' : ''}>Amount: High-Low</option>
            <option value="amount-asc" ${currentFilters.sortBy === 'amount-asc' ? 'selected' : ''}>Amount: Low-High</option>
            <option value="name-asc" ${currentFilters.sortBy === 'name-asc' ? 'selected' : ''}>Name: A-Z</option>
          </select>

          <!-- Clear Filters -->
          <button class="btn btn-ghost" id="txResetFiltersBtn" title="Reset Filters">
            <i data-lucide="rotate-ccw"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Transactions Table Card -->
    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Recipient / Source</th>
              <th>Transaction ID</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center; width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody id="txTableBody">
            <!-- Rendered by updateTable() -->
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-wrapper" id="txPaginationWrapper">
        <span style="font-size: 13px; color: var(--text-muted);" id="txPageInfo">Showing 0 of 0 transactions</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-ghost btn-sm" id="txPrevPageBtn" disabled>
            <i data-lucide="chevron-left"></i> Previous
          </button>
          <button class="btn btn-ghost btn-sm" id="txNextPageBtn" disabled>
            Next <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  attachTransactionEvents();
  updateTransactionsTable();
}

function getFilteredTransactions() {
  const allTxs = store.getTransactions();

  return allTxs.filter(t => {
    // Search match
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      const matchName = t.recipientName && t.recipientName.toLowerCase().includes(q);
      const matchId = t.id && t.id.toLowerCase().includes(q);
      const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
      const matchCat = t.category && t.category.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchNotes && !matchCat) return false;
    }

    // Type
    if (currentFilters.type !== 'all' && t.type !== currentFilters.type) return false;

    // Category
    if (currentFilters.category !== 'all' && t.category !== currentFilters.category) return false;

    // Status
    if (currentFilters.status !== 'all' && t.status !== currentFilters.status) return false;

    // Date range
    if (currentFilters.startDate) {
      const start = new Date(currentFilters.startDate).getTime();
      if (new Date(t.date).getTime() < start) return false;
    }
    if (currentFilters.endDate) {
      const end = new Date(currentFilters.endDate).getTime() + 86400000;
      if (new Date(t.date).getTime() > end) return false;
    }

    return true;
  }).sort((a, b) => {
    if (currentFilters.sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (currentFilters.sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (currentFilters.sortBy === 'amount-desc') {
      return b.amount - a.amount;
    } else if (currentFilters.sortBy === 'amount-asc') {
      return a.amount - b.amount;
    } else if (currentFilters.sortBy === 'name-asc') {
      return (a.recipientName || '').localeCompare(b.recipientName || '');
    }
    return 0;
  });
}

function updateTransactionsTable() {
  const tbody = document.getElementById('txTableBody');
  const pageInfo = document.getElementById('txPageInfo');
  const prevBtn = document.getElementById('txPrevPageBtn');
  const nextBtn = document.getElementById('txNextPageBtn');
  if (!tbody) return;

  const filtered = getFilteredTransactions();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const user = store.getUser();
  const currency = user.currency || '$';

  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i data-lucide="inbox" style="width: 36px; height: 36px; margin: 0 auto 12px; display: block; opacity: 0.5;"></i>
          No transactions match your selected filters.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageItems.map(t => {
      const initials = (t.recipientName || 'H7')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const isIncome = t.type === 'income';
      const amountFormatted = `${isIncome ? '+' : '-'}${currency}${t.amount.toFixed(2)}`;
      const amountClass = isIncome ? 'amount-positive' : 'amount-negative';

      const dateObj = new Date(t.date);
      const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                ${t.notes ? `<span class="entity-sub" title="${t.notes}">${t.notes.slice(0, 30)}${t.notes.length > 30 ? '...' : ''}</span>` : ''}
              </div>
            </div>
          </td>
          <td><code style="font-size: 11px; background: var(--bg-surface-subtle); padding: 2px 6px; border-radius: 4px;">#${t.id.slice(-6).toUpperCase()}</code></td>
          <td><span class="badge badge-category">${t.category}</span></td>
          <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
          <td><span style="font-size: 12px; color: var(--text-secondary);">${dateStr} • ${timeStr}</span></td>
          <td style="text-align: right;"><span class="${amountClass}">${amountFormatted}</span></td>
          <td style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
              <button class="btn btn-ghost btn-icon-only tx-edit-btn" data-id="${t.id}" title="Edit Transaction">
                <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-danger-ghost btn-icon-only tx-delete-btn" data-id="${t.id}" data-name="${t.recipientName}" title="Delete Transaction">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update pagination info
  if (pageInfo) {
    pageInfo.textContent = totalItems === 0
      ? 'Showing 0 transactions'
      : `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of ${totalItems} transactions (Page ${currentPage} of ${totalPages})`;
  }

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attach action button handlers
  document.querySelectorAll('.tx-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      window.openEditTransactionModal(id);
    });
  });

  document.querySelectorAll('.tx-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const name = e.currentTarget.getAttribute('data-name');
      window.openConfirmDeleteModal({
        title: 'Delete Transaction',
        message: `Are you sure you want to permanently delete transaction for "${name}"?`,
        onConfirm: () => {
          store.deleteTransaction(id);
          window.showToast('Transaction deleted successfully', 'success');
          updateTransactionsTable();
        }
      });
    });
  });
}

function attachTransactionEvents() {
  document.getElementById('addTxBtn')?.addEventListener('click', () => {
    window.openAddTransactionModal();
  });

  document.getElementById('exportTxBtn')?.addEventListener('click', () => {
    window.openExportModal();
  });

  document.getElementById('txSearchInput')?.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    currentPage = 1;
    updateTransactionsTable();
  });

  document.getElementById('txTypeFilter')?.addEventListener('change', (e) => {
    currentFilters.type = e.target.value;
    currentPage = 1;
    updateTransactionsTable();
  });

  document.getElementById('txCategoryFilter')?.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    currentPage = 1;
    updateTransactionsTable();
  });

  document.getElementById('txStatusFilter')?.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    currentPage = 1;
    updateTransactionsTable();
  });

  document.getElementById('txSortFilter')?.addEventListener('change', (e) => {
    currentFilters.sortBy = e.target.value;
    updateTransactionsTable();
  });

  document.getElementById('txResetFiltersBtn')?.addEventListener('click', () => {
    currentFilters = {
      search: '',
      type: 'all',
      category: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'date-desc'
    };
    renderTransactionsView();
  });

  document.getElementById('txPrevPageBtn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateTransactionsTable();
    }
  });

  document.getElementById('txNextPageBtn')?.addEventListener('click', () => {
    currentPage++;
    updateTransactionsTable();
  });
}
