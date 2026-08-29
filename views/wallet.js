/**
 * H007 Solutions Personal Finance Dashboard - Wallet View Controller
 */

import { store } from '../store.js';

export function renderWalletView() {
  const container = document.getElementById('wallet-view');
  if (!container) return;

  const cards = store.getCards();
  const txs = store.getTransactions();
  const user = store.getUser();
  const currency = user.currency || '$';

  // Calculate approximate card activity
  const totalCards = cards.length;
  const totalSpend = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>My Wallet & Cards</h1>
        <p>Manage your linked payment methods, corporate cards, and digital wallets.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="walletAddCardBtn">
          <i data-lucide="plus"></i>
          <span>Add New Card</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Row -->
    <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--spacing-xl);">
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Active Cards</span>
          <div class="metric-icon-box blue"><i data-lucide="credit-card"></i></div>
        </div>
        <div class="metric-value">${totalCards}</div>
        <div class="metric-footer"><span class="trend-text">Linked to H007 Solutions</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Digital Payment Security</span>
          <div class="metric-icon-box green"><i data-lucide="shield-check"></i></div>
        </div>
        <div class="metric-value" style="font-size: 1.35rem; color: var(--color-success);">256-bit Encrypted</div>
        <div class="metric-footer"><span class="trend-text">Masked storage protection</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Total Outflow</span>
          <div class="metric-icon-box purple"><i data-lucide="activity"></i></div>
        </div>
        <div class="metric-value">${currency}${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer"><span class="trend-text">Processed through linked accounts</span></div>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="card" style="margin-bottom: var(--spacing-xl);">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Saved Cards</h3>
          <p>Credit and debit cards active on your account</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; padding: 12px 0;">
        ${cards.length === 0 ? '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 32px;">No payment cards registered yet.</p>' : ''}
        ${cards.map((c, index) => renderWalletCardItem(c, index)).join('')}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  attachWalletEvents();
}

function renderWalletCardItem(card, index) {
  const skinClass = card.skin && card.skin !== 'default' ? `skin-${card.skin}` : '';
  const networkName = (card.cardType || 'visa').toUpperCase();

  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Realistic Card Visual -->
      <div class="credit-card-visual ${skinClass}" style="margin: 0 auto; width: 100%;">
        <div class="cc-top-row">
          <div class="cc-chip"></div>
          <div class="cc-contactless">
            <i data-lucide="wifi" style="width: 20px; height: 20px; transform: rotate(90deg);"></i>
          </div>
        </div>
        <div class="cc-number">${card.cardNumber || '•••• •••• •••• ' + card.last4}</div>
        <div class="cc-bottom-row">
          <div>
            <div class="cc-holder-label">Cardholder</div>
            <div class="cc-holder-name">${card.cardholderName || 'Alex Morgan'}</div>
          </div>
          <div>
            <div class="cc-expiry-label">Expires</div>
            <div class="cc-expiry-val">${card.expiryDate || '12/28'}</div>
          </div>
          <div class="cc-network-logo">${networkName}</div>
        </div>
      </div>

      <!-- Card Metadata & Actions -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px;">
        <div>
          <strong style="font-size: 14px; color: var(--text-primary); display: block;">${card.nickname || 'Payment Card'}</strong>
          <span style="font-size: 12px; color: var(--text-muted);">Ending in ${card.last4 || '4242'} • ${networkName}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-ghost btn-sm wallet-edit-card-btn" data-id="${card.id}">Edit</button>
          <button class="btn btn-danger-ghost btn-sm wallet-del-card-btn" data-id="${card.id}" data-nickname="${card.nickname || card.last4}">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function attachWalletEvents() {
  document.getElementById('walletAddCardBtn')?.addEventListener('click', () => {
    window.openAddCardModal();
  });

  document.querySelectorAll('.wallet-edit-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      window.openEditCardModal(id);
    });
  });

  document.querySelectorAll('.wallet-del-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const name = e.currentTarget.getAttribute('data-nickname');
      window.openConfirmDeleteModal({
        title: 'Delete Payment Card',
        message: `Are you sure you want to remove card "${name}" from your wallet?`,
        onConfirm: () => {
          store.deleteCard(id);
          window.showToast('Card removed from wallet', 'success');
          renderWalletView();
        }
      });
    });
  });
}
