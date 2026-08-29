/**
 * H007 Solutions Personal Finance Dashboard - Goals View Controller
 */

import { store } from '../store.js';

export function renderGoalsView() {
  const container = document.getElementById('goals-view');
  if (!container) return;

  const goals = store.getGoals();
  const user = store.getUser();
  const currency = user.currency || '$';

  const totalSavedInGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetInGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPct = totalTargetInGoals > 0 ? Math.min(Math.round((totalSavedInGoals / totalTargetInGoals) * 100), 100) : 0;

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Savings Goals</h1>
        <p>Set targets, track progress, and build your wealth systematically.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="addNewGoalBtn">
          <i data-lucide="plus"></i>
          <span>Create New Goal</span>
        </button>
      </div>
    </div>

    <!-- Goals Metric Summary -->
    <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--spacing-xl);">
      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Total Saved in Goals</span>
          <div class="metric-icon-box green"><i data-lucide="piggy-bank"></i></div>
        </div>
        <div class="metric-value">${currency}${totalSavedInGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer"><span class="trend-text">Across ${goals.length} active targets</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Overall Goal Target</span>
          <div class="metric-icon-box blue"><i data-lucide="target"></i></div>
        </div>
        <div class="metric-value">${currency}${totalTargetInGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="metric-footer"><span class="trend-text">Aggregate savings objective</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">Overall Milestone</span>
          <div class="metric-icon-box purple"><i data-lucide="award"></i></div>
        </div>
        <div class="metric-value">${overallPct}% Complete</div>
        <div class="metric-footer">
          <div class="limit-progress-bar-bg" style="width: 100%; height: 6px; margin-top: 4px;">
            <div class="limit-progress-bar-fill" style="width: ${overallPct}%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals Grid -->
    <div class="goals-grid">
      ${goals.length === 0 ? '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 48px;">No savings goals created yet. Click "Create New Goal" above to start!</p>' : ''}
      ${goals.map(g => renderGoalCard(g, currency)).join('')}
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  attachGoalsEvents();
}

function renderGoalCard(goal, currency) {
  const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const isComplete = goal.currentAmount >= goal.targetAmount;

  // Calculate remaining days
  const targetDateObj = new Date(goal.targetDate);
  const diffDays = Math.ceil((targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const remainingText = isComplete
    ? 'Goal Achieved!'
    : (diffDays > 0 ? `${diffDays} days remaining` : 'Target date passed');

  return `
    <div class="card goal-card">
      <div>
        <div class="goal-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="goal-icon">
              <i data-lucide="${isComplete ? 'check-circle' : 'target'}"></i>
            </div>
            <div>
              <h3 style="font-size: 1.15rem;">${goal.name}</h3>
              <span style="font-size: 12px; color: var(--text-muted);">${remainingText}</span>
            </div>
          </div>
          <span class="badge ${isComplete ? 'badge-completed' : 'badge-category'}">${pct}%</span>
        </div>

        <div style="margin: 20px 0 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary);">
              ${currency}${goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span style="font-size: 13px; color: var(--text-muted);">
              target: ${currency}${goal.targetAmount.toLocaleString()}
            </span>
          </div>

          <div class="limit-progress-bar-bg" style="height: 10px;">
            <div class="limit-progress-bar-fill ${isComplete ? 'positive' : ''}" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
          <span>Target Date: <strong>${new Date(goal.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
        </div>

        ${goal.contributions && goal.contributions.length > 0 ? `
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-bottom: 16px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 6px;">Recent Contributions</span>
            <div style="max-height: 70px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
              ${goal.contributions.slice(0, 3).map(c => `
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
                  <span>${new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${c.note || 'Transfer'}</span>
                  <strong style="color: var(--color-success);">+${currency}${c.amount.toFixed(2)}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 8px; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: auto;">
        <button class="btn btn-primary btn-sm add-funds-goal-btn" data-id="${goal.id}" style="flex: 1;">
          <i data-lucide="plus-circle"></i> Add Funds
        </button>
        <button class="btn btn-ghost btn-sm edit-goal-btn" data-id="${goal.id}" title="Edit Goal">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn btn-danger-ghost btn-sm del-goal-btn" data-id="${goal.id}" data-name="${goal.name}" title="Delete Goal">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `;
}

function attachGoalsEvents() {
  document.getElementById('addNewGoalBtn')?.addEventListener('click', () => {
    window.openAddGoalModal();
  });

  document.querySelectorAll('.add-funds-goal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      window.openAddFundsModal(id);
    });
  });

  document.querySelectorAll('.edit-goal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      window.openEditGoalModal(id);
    });
  });

  document.querySelectorAll('.del-goal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const name = e.currentTarget.getAttribute('data-name');
      window.openConfirmDeleteModal({
        title: 'Delete Savings Goal',
        message: `Are you sure you want to delete "${name}"? Progress history will be removed.`,
        onConfirm: () => {
          store.deleteGoal(id);
          window.showToast('Goal deleted successfully', 'success');
          renderGoalsView();
        }
      });
    });
  });
}
