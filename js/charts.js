/**
 * H007 Solutions Personal Finance Dashboard - Chart Manager
 * Manages Chart.js instances with responsive styling and brand colors
 */

import { store } from './store.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export class ChartManager {
  constructor() {
    this.charts = {};
  }

  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#94A3B8' : '#64748B',
      gridColor: isDark ? 'rgba(38, 49, 99, 0.6)' : 'rgba(226, 232, 240, 0.8)',
      tooltipBg: isDark ? '#141A38' : '#1A2254',
      tooltipText: '#FFFFFF',
      brandDarkBlue: '#2E3A8C',
      brandLightBlue: '#4A5FD9',
      brandNavy: '#1A2254',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      purple: '#8B5CF6'
    };
  }

  destroyChart(id) {
    if (this.charts[id]) {
      this.charts[id].destroy();
      delete this.charts[id];
    }
  }

  // ================= 1. Income Bar Chart =================
  renderIncomeChart(canvasId = 'incomeBarChart', period = 'last6') {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const txs = store.getTransactions().filter(t => t.type === 'income' && t.status !== 'failed');
    const colors = this.getThemeColors();
    const now = new Date();

    let monthCount = 6;
    if (period === 'thisMonth') monthCount = 1;
    else if (period === 'last3') monthCount = 3;
    else if (period === 'last6') monthCount = 6;
    else if (period === 'thisYear') monthCount = 12;

    const labels = [];
    const fixedData = [];
    const variableData = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      labels.push(`${MONTH_NAMES[mIdx]} ${monthCount > 6 ? "'" + yr.toString().slice(-2) : ''}`);

      const monthTxs = txs.filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === yr && td.getMonth() === mIdx;
      });

      const fixedSum = monthTxs
        .filter(t => t.isFixed)
        .reduce((sum, t) => sum + t.amount, 0);

      const varSum = monthTxs
        .filter(t => !t.isFixed)
        .reduce((sum, t) => sum + t.amount, 0);

      fixedData.push(fixedSum);
      variableData.push(varSum);
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const fixedColor = isDark ? '#4A5FD9' : '#2E3A8C';
    const variableColor = isDark ? '#818CF8' : '#6366F1';

    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fixed Income',
            data: fixedData,
            backgroundColor: fixedColor,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Variable Income',
            data: variableData,
            backgroundColor: variableColor,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              color: colors.textColor,
              font: { family: 'Inter', size: 12, weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => '$' + val.toLocaleString()
            }
          }
        }
      }
    });
  }

  // ================= 2. Budget Donut Chart =================
  renderBudgetDonutChart(canvasId = 'budgetDonutChart', period = 'thisMonth') {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const budgets = store.getBudgets();
    const txs = store.getTransactions().filter(t => t.type === 'expense' && t.status !== 'failed');
    const colors = this.getThemeColors();
    const now = new Date();

    let targetDateFilter = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (period === 'lastMonth') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetDateFilter = (d) => d.getFullYear() === lastM.getFullYear() && d.getMonth() === lastM.getMonth();
    } else if (period === 'thisYear') {
      targetDateFilter = (d) => d.getFullYear() === now.getFullYear();
    }

    const filteredTxs = txs.filter(t => targetDateFilter(new Date(t.date)));

    const categories = ['Investment', 'Travelling', 'Food & Grocery', 'Entertainment', 'Healthcare'];
    const catColors = ['#2E3A8C', '#4A5FD9', '#10B981', '#F59E0B', '#8B5CF6'];

    const spentAmounts = categories.map(cat => {
      return filteredTxs
        .filter(t => t.category.toLowerCase().includes(cat.toLowerCase()) || (cat === 'Travelling' && t.category === 'Travel'))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const totalAllocated = budgets.reduce((acc, b) => acc + (b.allocated * (period === 'thisYear' ? 12 : 1)), 0);
    const totalSpent = spentAmounts.reduce((acc, v) => acc + v, 0);

    // Update center DOM text
    const centerTotalEl = document.getElementById('budgetCenterTotal');
    const centerSpentEl = document.getElementById('budgetCenterSpent');
    if (centerTotalEl) centerTotalEl.textContent = `$${Math.round(totalSpent).toLocaleString()}`;
    if (centerSpentEl) centerSpentEl.textContent = `of $${Math.round(totalAllocated).toLocaleString()}`;

    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: spentAmounts.map(v => v > 0 ? v : 10), // minimum visible slice
          backgroundColor: catColors,
          borderWidth: 3,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#141A38' : '#FFFFFF',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              color: colors.textColor,
              font: { family: 'Inter', size: 11, weight: '500' },
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: $${spentAmounts[ctx.dataIndex].toLocaleString()}`
            }
          }
        }
      }
    });
  }

  // ================= 3. Analytics Spending Trends Line Chart =================
  renderSpendingTrendsChart(canvasId = 'spendingTrendsChart', timeframe = 'monthly') {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    const txs = store.getTransactions().filter(t => t.type === 'expense' && t.status !== 'failed');
    const now = new Date();

    let labels = [];
    let currentData = [];
    let previousData = [];

    if (timeframe === 'weekly') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      currentData = [120, 240, 180, 310, 420, 290, 160];
      previousData = [140, 190, 210, 260, 380, 220, 190];
    } else if (timeframe === 'yearly') {
      labels = ['2023', '2024', '2025', '2026'];
      currentData = [34000, 42000, 49000, 52000];
      previousData = [30000, 38000, 44000, 47000];
    } else {
      // Monthly (6 months)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(MONTH_NAMES[d.getMonth()]);

        const mExpenses = txs
          .filter(t => {
            const td = new Date(t.date);
            return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
          })
          .reduce((sum, t) => sum + t.amount, 0);

        currentData.push(Math.round(mExpenses));
        // Synthetic previous year comparison baseline
        previousData.push(Math.round(mExpenses * 0.9 + (i % 2 === 0 ? 120 : -150)));
      }
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(74, 95, 217, 0.3)');
    gradient.addColorStop(1, 'rgba(74, 95, 217, 0.0)');

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Current Period',
            data: currentData,
            borderColor: '#4A5FD9',
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#2E3A8C',
            pointBorderColor: '#FFFFFF',
            pointHoverRadius: 6,
            borderWidth: 3
          },
          {
            label: 'Previous Period',
            data: previousData,
            borderColor: colors.textColor,
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => '$' + val.toLocaleString()
            }
          }
        }
      }
    });
  }

  // ================= 4. Analytics Category Breakdown =================
  renderCategoryBreakdownChart(canvasId = 'categoryBreakdownChart') {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const txs = store.getTransactions().filter(t => t.type === 'expense' && t.status !== 'failed');
    const colors = this.getThemeColors();

    const catTotals = {};
    txs.forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    const sortedCats = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const labels = sortedCats.map(c => c[0]);
    const data = sortedCats.map(c => Math.round(c[1]));

    const palette = ['#2E3A8C', '#4A5FD9', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6'];

    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Spent',
          data,
          backgroundColor: palette.slice(0, labels.length),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` Total Spent: $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => '$' + val.toLocaleString()
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          }
        }
      }
    });
  }

  // ================= 5. Income vs Expenses Comparison =================
  renderIncomeVsExpenseChart(canvasId = 'incomeVsExpenseChart') {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = this.getThemeColors();
    const txs = store.getTransactions().filter(t => t.status !== 'failed');
    const now = new Date();

    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      labels.push(MONTH_NAMES[mIdx]);

      const monthTxs = txs.filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === yr && td.getMonth() === mIdx;
      });

      const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(inc);
      expenseData.push(exp);
      savingsData.push(inc - exp);
    }

    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10B981',
            borderRadius: 6,
            barPercentage: 0.7
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: '#EF4444',
            borderRadius: 6,
            barPercentage: 0.7
          },
          {
            type: 'line',
            label: 'Net Savings',
            data: savingsData,
            borderColor: '#2E3A8C',
            backgroundColor: '#2E3A8C',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              color: colors.textColor,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          y: {
            grid: { color: colors.gridColor, drawBorder: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => '$' + val.toLocaleString()
            }
          }
        }
      }
    });
  }

  updateAllCharts() {
    // Re-renders all active visible charts (e.g. after theme toggle or data update)
    if (document.getElementById('incomeBarChart')) this.renderIncomeChart();
    if (document.getElementById('budgetDonutChart')) this.renderBudgetDonutChart();
    if (document.getElementById('spendingTrendsChart')) this.renderSpendingTrendsChart();
    if (document.getElementById('categoryBreakdownChart')) this.renderCategoryBreakdownChart();
    if (document.getElementById('incomeVsExpenseChart')) this.renderIncomeVsExpenseChart();
  }
}

export const chartManager = new ChartManager();
