/**
 * H007 Solutions Personal Finance Dashboard - Main Application Controller
 */

import { store, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './store.js';
import { chartManager } from './charts.js';
import { renderDashboard } from './views/dashboard.js';
import { renderTransactionsView } from './views/transactions.js';
import { renderWalletView } from './views/wallet.js';
import { renderGoalsView } from './views/goals.js';
import { renderAnalyticsView } from './views/analytics.js';
import { renderReportsView } from './views/reports.js';
import { exportTransactionsCSV } from './export.js';

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupGlobalSearch();
    this.setupNotifications();
    this.setupSettingsModal();
    this.setupSharedModals();
    this.renderCurrentView();
    this.updateUserHeader();

    // Expose global window helpers
    window.switchTab = (tabId) => this.switchTab(tabId);
    window.showToast = (msg, type) => this.showToast(msg, type);
    window.openAddTransactionModal = () => this.openTransactionModal();
    window.openEditTransactionModal = (id) => this.openTransactionModal(id);
    window.openAddCardModal = () => this.openCardModal();
    window.openEditCardModal = (id) => this.openCardModal(id);
    window.openAddGoalModal = () => this.openGoalModal();
    window.openEditGoalModal = (id) => this.openGoalModal(id);
    window.openAddFundsModal = (id) => this.openAddFundsModal(id);
    window.openConfirmDeleteModal = (opts) => this.openConfirmDeleteModal(opts);
    window.openExportModal = () => this.openExportModal();
  }

  // ================= 1. Theme Management =================
  setupTheme() {
    const settings = store.getSettings();
    const savedTheme = settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggleIcon(savedTheme);

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      store.saveSettings({ theme: nextTheme });
      this.updateThemeToggleIcon(nextTheme);
      chartManager.updateAllCharts();
    });
  }

  updateThemeToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? '<i data-lucide="sun"></i>'
      : '<i data-lucide="moon"></i>';
    if (window.lucide) window.lucide.createIcons();
  }

  // ================= 2. Navigation / Tab Switching =================
  setupNavigation() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    document.querySelector('.brand-wrapper')?.addEventListener('click', () => {
      this.switchTab('dashboard');
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Tab Panels
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`${tabId}-view`);
    if (targetPanel) {
      targetPanel.classList.add('active');
      this.renderCurrentView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    switch (this.currentTab) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'transactions':
        renderTransactionsView();
        break;
      case 'wallet':
        renderWalletView();
        break;
      case 'goals':
        renderGoalsView();
        break;
      case 'analytics':
        renderAnalyticsView();
        break;
      case 'reports':
        renderReportsView();
        break;
    }
  }

  // ================= 3. Global Search =================
  setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('globalSearchResults');
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        return;
      }

      const txs = store.getTransactions().filter(t =>
        (t.recipientName && t.recipientName.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q))
      ).slice(0, 5);

      const goals = store.getGoals().filter(g =>
        g.name.toLowerCase().includes(q)
      ).slice(0, 2);

      const cards = store.getCards().filter(c =>
        (c.nickname && c.nickname.toLowerCase().includes(q)) ||
        (c.cardholderName && c.cardholderName.toLowerCase().includes(q)) ||
        (c.last4 && c.last4.includes(q))
      ).slice(0, 2);

      if (txs.length === 0 && goals.length === 0 && cards.length === 0) {
        dropdown.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No results found for "${q}"
          </div>
        `;
      } else {
        let html = '';

        if (txs.length > 0) {
          html += `<div style="padding: 8px 12px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Transactions</div>`;
          html += txs.map(t => `
            <div class="search-result-item" data-action="open-tx" data-id="${t.id}">
              <div>
                <strong style="font-size: 13px; display: block;">${t.recipientName}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${t.category} • ${new Date(t.date).toLocaleDateString()}</span>
              </div>
              <span style="font-weight: 700; font-size: 13px; color: ${t.type === 'income' ? 'var(--color-success)' : 'var(--text-primary)'};">
                ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
              </span>
            </div>
          `).join('');
        }

        if (goals.length > 0) {
          html += `<div style="padding: 8px 12px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Savings Goals</div>`;
          html += goals.map(g => `
            <div class="search-result-item" data-action="open-goal">
              <div>
                <strong style="font-size: 13px; display: block;">${g.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">$${g.currentAmount.toLocaleString()} of $${g.targetAmount.toLocaleString()}</span>
              </div>
              <span class="badge badge-category">Goal</span>
            </div>
          `).join('');
        }

        if (cards.length > 0) {
          html += `<div style="padding: 8px 12px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Cards</div>`;
          html += cards.map(c => `
            <div class="search-result-item" data-action="open-wallet">
              <div>
                <strong style="font-size: 13px; display: block;">${c.nickname || 'Payment Card'}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">Ending in ${c.last4}</span>
              </div>
              <span class="badge badge-category">${(c.cardType || 'card').toUpperCase()}</span>
            </div>
          `).join('');
        }

        dropdown.innerHTML = html;
      }

      dropdown.classList.add('show');

      // Attach click events to search result items
      dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.getAttribute('data-action');
          dropdown.classList.remove('show');
          searchInput.value = '';

          if (action === 'open-tx') {
            this.switchTab('transactions');
          } else if (action === 'open-goal') {
            this.switchTab('goals');
          } else if (action === 'open-wallet') {
            this.switchTab('wallet');
          }
        });
      });
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  // ================= 4. Notifications Drawer =================
  setupNotifications() {
    const notifBtn = document.getElementById('notificationsBtn');
    const drawer = document.getElementById('notificationDrawer');
    const countBadge = document.getElementById('notifCountBadge');
    if (!notifBtn || !drawer) return;

    const updateNotifsList = () => {
      const notifs = store.getNotifications();
      const unreadCount = notifs.filter(n => n.unread).length;
      if (countBadge) {
        if (unreadCount > 0) {
          countBadge.textContent = unreadCount;
          countBadge.style.display = 'flex';
        } else {
          countBadge.style.display = 'none';
        }
      }

      const listContainer = document.getElementById('notificationList');
      if (listContainer) {
        listContainer.innerHTML = notifs.map(n => `
          <div class="notification-item ${n.unread ? 'unread' : ''}">
            <div class="notif-icon" style="background: rgba(74, 95, 217, 0.12); color: var(--jm-light-blue);">
              <i data-lucide="bell" style="width: 16px; height: 16px;"></i>
            </div>
            <div style="flex: 1;">
              <strong style="font-size: 13px; color: var(--text-primary); display: block;">${n.title}</strong>
              <span style="font-size: 11px; color: var(--text-muted);">${n.time}</span>
            </div>
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
      }
    };

    updateNotifsList();

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drawer.classList.toggle('show');
      if (drawer.classList.contains('show')) {
        store.markNotificationsRead();
        updateNotifsList();
      }
    });

    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !notifBtn.contains(e.target)) {
        drawer.classList.remove('show');
      }
    });
  }

  // ================= 5. User Profile & Settings Modal =================
  updateUserHeader() {
    const user = store.getUser();
    const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const avatarEl = document.getElementById('userAvatarDisplay');
    const nameEl = document.getElementById('userNameDisplay');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = user.name;
  }

  setupSettingsModal() {
    const trigger = document.getElementById('userProfileTrigger');
    const settingsBtn = document.getElementById('headerSettingsBtn');
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const openSettings = () => {
      const user = store.getUser();
      document.getElementById('settingsNameInput').value = user.name || '';
      document.getElementById('settingsEmailInput').value = user.email || '';
      document.getElementById('settingsCurrencyInput').value = user.currency || '$';
      document.getElementById('settingsLimitInput').value = user.monthlySpendingLimit || 4500;
      modal.classList.add('show');
    };

    trigger?.addEventListener('click', openSettings);
    settingsBtn?.addEventListener('click', openSettings);

    document.getElementById('closeSettingsModalBtn')?.addEventListener('click', () => modal.classList.remove('show'));
    document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => modal.classList.remove('show'));

    document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedUser = {
        name: document.getElementById('settingsNameInput').value.trim(),
        email: document.getElementById('settingsEmailInput').value.trim(),
        currency: document.getElementById('settingsCurrencyInput').value,
        monthlySpendingLimit: parseFloat(document.getElementById('settingsLimitInput').value) || 4500
      };
      store.saveUser(updatedUser);
      this.updateUserHeader();
      modal.classList.remove('show');
      this.showToast('Profile settings saved successfully', 'success');
      this.renderCurrentView();
    });

    document.getElementById('resetAllDataBtn')?.addEventListener('click', () => {
      this.openConfirmDeleteModal({
        title: 'Reset to Sample Data',
        message: 'This will reset all your transactions, goals, and cards to standard H007 Solutions sample data. Proceed?',
        onConfirm: () => {
          store.resetAllData();
          modal.classList.remove('show');
          this.updateUserHeader();
          this.showToast('Sample financial data reset successfully', 'info');
          this.renderCurrentView();
        }
      });
    });
  }

  // ================= 6. Shared Modals Handlers =================
  setupSharedModals() {
    // Transaction Modal Type dynamic category updates
    const typeSelect = document.getElementById('modalTxType');
    const categorySelect = document.getElementById('modalTxCategory');

    const updateCategories = (selectedType, currentVal = '') => {
      if (!categorySelect) return;
      const cats = selectedType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
      categorySelect.innerHTML = cats.map(c =>
        `<option value="${c.name}" ${currentVal === c.name ? 'selected' : ''}>${c.name}</option>`
      ).join('');
    };

    typeSelect?.addEventListener('change', (e) => {
      updateCategories(e.target.value);
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
      });
    });
  }

  openTransactionModal(editId = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const titleEl = document.getElementById('txModalTitle');
    const typeSelect = document.getElementById('modalTxType');
    const catSelect = document.getElementById('modalTxCategory');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('modalTxId').value = editId || '';

    const updateCategories = (selectedType, currentVal = '') => {
      const cats = selectedType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
      catSelect.innerHTML = cats.map(c =>
        `<option value="${c.name}" ${currentVal === c.name ? 'selected' : ''}>${c.name}</option>`
      ).join('');
    };

    if (editId) {
      const tx = store.getTransactions().find(t => t.id === editId);
      if (!tx) return;
      titleEl.textContent = 'Edit Transaction';
      typeSelect.value = tx.type;
      updateCategories(tx.type, tx.category);
      document.getElementById('modalTxAmount').value = tx.amount;
      document.getElementById('modalTxRecipient').value = tx.recipientName;
      document.getElementById('modalTxDate').value = new Date(tx.date).toISOString().slice(0, 16);
      document.getElementById('modalTxStatus').value = tx.status || 'completed';
      document.getElementById('modalTxNotes').value = tx.notes || '';
    } else {
      titleEl.textContent = 'Add New Transaction';
      typeSelect.value = 'expense';
      updateCategories('expense');
      document.getElementById('modalTxDate').value = new Date().toISOString().slice(0, 16);
      document.getElementById('modalTxStatus').value = 'completed';
    }

    modal.classList.add('show');

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('modalTxId').value;
      const txData = {
        type: typeSelect.value,
        amount: parseFloat(document.getElementById('modalTxAmount').value),
        category: catSelect.value,
        recipientName: document.getElementById('modalTxRecipient').value.trim(),
        date: new Date(document.getElementById('modalTxDate').value).toISOString(),
        status: document.getElementById('modalTxStatus').value,
        notes: document.getElementById('modalTxNotes').value.trim()
      };

      if (id) {
        store.updateTransaction(id, txData);
        this.showToast('Transaction updated successfully', 'success');
      } else {
        store.addTransaction(txData);
        this.showToast('New transaction recorded', 'success');
      }

      modal.classList.remove('show');
      this.renderCurrentView();
    };
  }

  openCardModal(editId = null) {
    const modal = document.getElementById('cardModal');
    const form = document.getElementById('cardForm');
    const titleEl = document.getElementById('cardModalTitle');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('modalCardId').value = editId || '';

    if (editId) {
      const card = store.getCards().find(c => c.id === editId);
      if (!card) return;
      titleEl.textContent = 'Edit Payment Card';
      document.getElementById('modalCardNumber').value = card.last4 ? `•••• •••• •••• ${card.last4}` : '';
      document.getElementById('modalCardHolder').value = card.cardholderName;
      document.getElementById('modalCardExpiry').value = card.expiryDate;
      document.getElementById('modalCardType').value = card.cardType || 'visa';
      document.getElementById('modalCardNickname').value = card.nickname || '';
      document.getElementById('modalCardSkin').value = card.skin || 'default';
    } else {
      titleEl.textContent = 'Add Payment Card';
      document.getElementById('modalCardType').value = 'visa';
      document.getElementById('modalCardSkin').value = 'default';
    }

    modal.classList.add('show');

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('modalCardId').value;
      const cardData = {
        cardNumber: document.getElementById('modalCardNumber').value.trim(),
        cardholderName: document.getElementById('modalCardHolder').value.trim(),
        expiryDate: document.getElementById('modalCardExpiry').value.trim(),
        cardType: document.getElementById('modalCardType').value,
        nickname: document.getElementById('modalCardNickname').value.trim(),
        skin: document.getElementById('modalCardSkin').value
      };

      if (id) {
        store.updateCard(id, cardData);
        this.showToast('Card updated successfully', 'success');
      } else {
        store.addCard(cardData);
        this.showToast('New card added to wallet', 'success');
      }

      modal.classList.remove('show');
      this.renderCurrentView();
    };
  }

  openGoalModal(editId = null) {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    const titleEl = document.getElementById('goalModalTitle');
    const initialDepGroup = document.getElementById('modalGoalInitialGroup');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('modalGoalId').value = editId || '';

    if (editId) {
      const goal = store.getGoals().find(g => g.id === editId);
      if (!goal) return;
      titleEl.textContent = 'Edit Savings Goal';
      document.getElementById('modalGoalName').value = goal.name;
      document.getElementById('modalGoalTarget').value = goal.targetAmount;
      document.getElementById('modalGoalDate').value = goal.targetDate.split('T')[0];
      if (initialDepGroup) initialDepGroup.style.display = 'none';
    } else {
      titleEl.textContent = 'Create Savings Goal';
      const defaultDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
      document.getElementById('modalGoalDate').value = defaultDate;
      if (initialDepGroup) initialDepGroup.style.display = 'block';
    }

    modal.classList.add('show');

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('modalGoalId').value;
      const goalData = {
        name: document.getElementById('modalGoalName').value.trim(),
        targetAmount: parseFloat(document.getElementById('modalGoalTarget').value),
        targetDate: document.getElementById('modalGoalDate').value,
        currentAmount: parseFloat(document.getElementById('modalGoalInitial')?.value || 0)
      };

      if (id) {
        store.updateGoal(id, goalData);
        this.showToast('Goal updated successfully', 'success');
      } else {
        store.addGoal(goalData);
        this.showToast('New savings goal created!', 'success');
      }

      modal.classList.remove('show');
      this.renderCurrentView();
    };
  }

  openAddFundsModal(goalId) {
    const goal = store.getGoals().find(g => g.id === goalId);
    if (!goal) return;

    const modal = document.getElementById('addFundsModal');
    const form = document.getElementById('addFundsForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('fundsGoalNameDisplay').textContent = goal.name;
    modal.classList.add('show');

    form.onsubmit = (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('fundsAmountInput').value);
      const note = document.getElementById('fundsNoteInput').value.trim() || 'Manual deposit';

      store.contributeToGoal(goalId, amount, note);
      this.showToast(`Deposited $${amount.toFixed(2)} to ${goal.name}!`, 'success');
      modal.classList.remove('show');
      this.renderCurrentView();
    };
  }

  openConfirmDeleteModal({ title, message, onConfirm }) {
    const modal = document.getElementById('confirmDeleteModal');
    if (!modal) return;

    document.getElementById('confirmDeleteTitle').textContent = title || 'Confirm Deletion';
    document.getElementById('confirmDeleteMessage').textContent = message || 'Are you sure you want to delete this item?';

    const confirmBtn = document.getElementById('confirmDeleteActionBtn');

    const handler = () => {
      if (onConfirm) onConfirm();
      modal.classList.remove('show');
      confirmBtn.removeEventListener('click', handler);
    };

    confirmBtn.onclick = handler;
    modal.classList.add('show');
  }

  openExportModal() {
    const modal = document.getElementById('exportModal');
    if (!modal) return;
    modal.classList.add('show');

    document.getElementById('exportCsvExecuteBtn').onclick = () => {
      const type = document.getElementById('exportModalType').value;
      const startDate = document.getElementById('exportModalStartDate').value;
      const endDate = document.getElementById('exportModalEndDate').value;
      exportTransactionsCSV({ type, startDate, endDate });
      modal.classList.remove('show');
      this.showToast('CSV Export generated successfully', 'success');
    };
  }

  // ================= 7. Toast System =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'danger') iconName = 'alert-triangle';
    else if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Initialize Application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
