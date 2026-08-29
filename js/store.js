/**
 * H007 Solutions Personal Finance Dashboard - State Management & Storage
 * Handles data persistence, calculations, and default seed generation
 */

const STORAGE_KEYS = {
  USER: 'h007_finance_user',
  TRANSACTIONS: 'h007_finance_transactions',
  CARDS: 'h007_finance_cards',
  GOALS: 'h007_finance_goals',
  BUDGETS: 'h007_finance_budgets',
  SETTINGS: 'h007_finance_settings',
  NOTIFICATIONS: 'h007_finance_notifications'
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat_food', name: 'Food & Grocery', icon: 'shopping-cart' },
  { id: 'cat_trans', name: 'Transportation', icon: 'car' },
  { id: 'cat_ent', name: 'Entertainment', icon: 'film' },
  { id: 'cat_health', name: 'Healthcare', icon: 'activity' },
  { id: 'cat_shop', name: 'Shopping', icon: 'shopping-bag' },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'zap' },
  { id: 'cat_travel', name: 'Travel', icon: 'map-pin' },
  { id: 'cat_edu', name: 'Education', icon: 'book' },
  { id: 'cat_subs', name: 'Subscriptions', icon: 'tv' },
  { id: 'cat_other_exp', name: 'Other', icon: 'more-horizontal' }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'cat_salary', name: 'Salary', icon: 'dollar-sign', isFixed: true },
  { id: 'cat_freelance', name: 'Freelance', icon: 'briefcase', isFixed: false },
  { id: 'cat_invest', name: 'Investments', icon: 'trending-up', isFixed: false },
  { id: 'cat_rental', name: 'Rental Income', icon: 'home', isFixed: true },
  { id: 'cat_gifts', name: 'Gifts', icon: 'gift', isFixed: false },
  { id: 'cat_refunds', name: 'Refunds', icon: 'rotate-ccw', isFixed: false },
  { id: 'cat_other_inc', name: 'Other', icon: 'plus-circle', isFixed: false }
];

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Investment', allocated: 1200, color: '#2E3A8C' },
  { name: 'Travelling', allocated: 600, color: '#4A5FD9' },
  { name: 'Food & Grocery', allocated: 850, color: '#10B981' },
  { name: 'Entertainment', allocated: 400, color: '#F59E0B' },
  { name: 'Healthcare', allocated: 350, color: '#8B5CF6' }
];

export class Store {
  constructor() {
    this.initData();
  }

  initData() {
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.seedInitialData();
    }
  }

  // ================= User & Settings =================
  getUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || {
      id: 'usr_001',
      name: 'Alex Morgan',
      email: 'alex.morgan@jmsolutionss.com',
      avatar: null,
      currency: '$',
      monthlySpendingLimit: 4500,
      createdAt: new Date().toISOString()
    };
  }

  saveUser(userData) {
    const current = this.getUser();
    const updated = { ...current, ...userData };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
      theme: 'light',
      currency: '$'
    };
  }

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // ================= Transactions =================
  getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
  }

  saveTransactions(txs) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  addTransaction(tx) {
    const txs = this.getTransactions();
    const newTx = {
      id: tx.id || 'tx_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: tx.type, // 'income' | 'expense'
      amount: parseFloat(tx.amount),
      category: tx.category,
      recipientName: tx.recipientName,
      status: tx.status || 'completed',
      date: tx.date || new Date().toISOString(),
      notes: tx.notes || '',
      isFixed: tx.isFixed !== undefined ? tx.isFixed : (tx.category === 'Salary' || tx.category === 'Rental Income'),
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    this.saveTransactions(txs);
    return newTx;
  }

  updateTransaction(id, updatedFields) {
    const txs = this.getTransactions();
    const index = txs.findIndex(t => t.id === id);
    if (index !== -1) {
      txs[index] = { ...txs[index], ...updatedFields };
      if (updatedFields.amount !== undefined) {
        txs[index].amount = parseFloat(updatedFields.amount);
      }
      this.saveTransactions(txs);
      return txs[index];
    }
    return null;
  }

  deleteTransaction(id) {
    const txs = this.getTransactions();
    const filtered = txs.filter(t => t.id !== id);
    this.saveTransactions(filtered);
    return true;
  }

  // ================= Cards =================
  getCards() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS)) || [];
  }

  saveCards(cards) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }

  addCard(card) {
    const cards = this.getCards();
    const cleanLast4 = card.cardNumber ? card.cardNumber.replace(/\s+/g, '').slice(-4) : '4242';
    const newCard = {
      id: 'card_' + Date.now().toString(36),
      cardNumber: `•••• •••• •••• ${cleanLast4}`,
      last4: cleanLast4,
      cardholderName: card.cardholderName || 'Alex Morgan',
      expiryDate: card.expiryDate || '12/28',
      cardType: card.cardType || 'visa',
      nickname: card.nickname || 'Primary Card',
      skin: card.skin || 'default',
      createdAt: new Date().toISOString()
    };
    cards.push(newCard);
    this.saveCards(cards);
    return newCard;
  }

  updateCard(id, updatedFields) {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === id);
    if (index !== -1) {
      if (updatedFields.cardNumber && !updatedFields.cardNumber.startsWith('••••')) {
        const last4 = updatedFields.cardNumber.replace(/\s+/g, '').slice(-4);
        updatedFields.cardNumber = `•••• •••• •••• ${last4}`;
        updatedFields.last4 = last4;
      }
      cards[index] = { ...cards[index], ...updatedFields };
      this.saveCards(cards);
      return cards[index];
    }
    return null;
  }

  deleteCard(id) {
    const cards = this.getCards();
    const filtered = cards.filter(c => c.id !== id);
    this.saveCards(filtered);
    return true;
  }

  // ================= Goals =================
  getGoals() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS)) || [];
  }

  saveGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  addGoal(goal) {
    const goals = this.getGoals();
    const newGoal = {
      id: 'goal_' + Date.now().toString(36),
      name: goal.name,
      targetAmount: parseFloat(goal.targetAmount),
      currentAmount: parseFloat(goal.currentAmount || 0),
      targetDate: goal.targetDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      contributions: goal.currentAmount > 0 ? [{
        date: new Date().toISOString(),
        amount: parseFloat(goal.currentAmount),
        note: 'Initial deposit'
      }] : []
    };
    goals.push(newGoal);
    this.saveGoals(goals);
    return newGoal;
  }

  updateGoal(id, updatedFields) {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      if (updatedFields.targetAmount) updatedFields.targetAmount = parseFloat(updatedFields.targetAmount);
      if (updatedFields.currentAmount) updatedFields.currentAmount = parseFloat(updatedFields.currentAmount);
      goals[index] = { ...goals[index], ...updatedFields };
      this.saveGoals(goals);
      return goals[index];
    }
    return null;
  }

  contributeToGoal(id, amount, note = 'Savings contribution') {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      const amt = parseFloat(amount);
      goals[index].currentAmount = (goals[index].currentAmount || 0) + amt;
      if (!goals[index].contributions) goals[index].contributions = [];
      goals[index].contributions.unshift({
        date: new Date().toISOString(),
        amount: amt,
        note
      });
      this.saveGoals(goals);
      return goals[index];
    }
    return null;
  }

  deleteGoal(id) {
    const goals = this.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    this.saveGoals(filtered);
    return true;
  }

  // ================= Budgets =================
  getBudgets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || DEFAULT_BUDGET_CATEGORIES;
  }

  saveBudgets(budgets) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }

  // ================= Notifications =================
  getNotifications() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [
      { id: 'notif_1', title: 'Monthly Salary Credited', time: '2 hours ago', unread: true, type: 'income' },
      { id: 'notif_2', title: 'Budget Alert: Food & Grocery at 78%', time: 'Yesterday', unread: true, type: 'warning' },
      { id: 'notif_3', title: 'Goal Milestone: Emergency Fund 65%', time: '3 days ago', unread: false, type: 'goal' }
    ];
  }

  markNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, unread: false }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  // ================= Financial Calculations =================
  getMetrics() {
    const txs = this.getTransactions();
    const user = this.getUser();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Calculate All-time Total Balance
    const totalBalance = txs.reduce((acc, t) => {
      if (t.status === 'failed') return acc;
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    // Filter current month transactions
    const currentMonthTxs = txs.filter(t => {
      if (t.status === 'failed') return false;
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const currentIncome = currentMonthTxs
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const currentExpense = currentMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const currentSavings = currentIncome - currentExpense;

    // Filter previous month transactions
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const prevMonthTxs = txs.filter(t => {
      if (t.status === 'failed') return false;
      const d = new Date(t.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const prevIncome = prevMonthTxs
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const prevExpense = prevMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const prevSavings = prevIncome - prevExpense;

    // MoM Percentages
    const calcChange = (curr, prev) => {
      if (!prev || prev === 0) return { percent: 0, isPositive: true };
      const pct = Math.round(((curr - prev) / prev) * 100 * 10) / 10;
      return { percent: Math.abs(pct), isPositive: pct >= 0, rawChange: pct };
    };

    // Balance change estimate
    const balanceChange = calcChange(totalBalance, totalBalance - currentSavings);
    const incomeChange = calcChange(currentIncome, prevIncome);
    const expenseChange = calcChange(currentExpense, prevExpense);
    const savingsChange = calcChange(currentSavings, prevSavings);

    return {
      totalBalance,
      currentIncome,
      currentExpense,
      currentSavings,
      monthlySpendingLimit: user.monthlySpendingLimit || 4500,
      changes: {
        balance: balanceChange,
        income: incomeChange,
        expense: expenseChange,
        savings: savingsChange
      }
    };
  }

  // Generate rich seed data across 6 months
  seedInitialData() {
    const user = {
      id: 'usr_001',
      name: 'Alex Morgan',
      email: 'alex.morgan@jmsolutionss.com',
      avatar: null,
      currency: '$',
      monthlySpendingLimit: 4500,
      createdAt: new Date().toISOString()
    };

    const cards = [
      {
        id: 'card_1',
        cardNumber: '•••• •••• •••• 4242',
        last4: '4242',
        cardholderName: 'Alex Morgan',
        expiryDate: '09/28',
        cardType: 'visa',
        nickname: 'H007 Signature Platinum',
        skin: 'default',
        createdAt: new Date().toISOString()
      },
      {
        id: 'card_2',
        cardNumber: '•••• •••• •••• 8819',
        last4: '8819',
        cardholderName: 'Alex Morgan',
        expiryDate: '11/27',
        cardType: 'mastercard',
        nickname: 'Corporate Travel Card',
        skin: 'emerald',
        createdAt: new Date().toISOString()
      },
      {
        id: 'card_3',
        cardNumber: '•••• •••• •••• 1004',
        last4: '1004',
        cardholderName: 'Alex Morgan',
        expiryDate: '05/29',
        cardType: 'amex',
        nickname: 'Black Reserve',
        skin: 'dark',
        createdAt: new Date().toISOString()
      }
    ];

    const goals = [
      {
        id: 'goal_1',
        name: 'Emergency Fund',
        targetAmount: 15000,
        currentAmount: 10500,
        targetDate: '2026-12-31',
        createdAt: '2026-01-10T00:00:00Z',
        contributions: [
          { date: '2026-08-01', amount: 500, note: 'Monthly automatic transfer' },
          { date: '2026-07-01', amount: 1000, note: 'Bonus deposit' },
          { date: '2026-06-01', amount: 500, note: 'Monthly automatic transfer' }
        ]
      },
      {
        id: 'goal_2',
        name: 'Vacation to Japan',
        targetAmount: 6000,
        currentAmount: 4200,
        targetDate: '2026-11-15',
        createdAt: '2026-02-15T00:00:00Z',
        contributions: [
          { date: '2026-08-10', amount: 400, note: 'Flight savings' },
          { date: '2026-07-15', amount: 600, note: 'Hotel fund' }
        ]
      },
      {
        id: 'goal_3',
        name: 'New EV Car Downpayment',
        targetAmount: 12000,
        currentAmount: 3800,
        targetDate: '2027-04-30',
        createdAt: '2026-03-01T00:00:00Z',
        contributions: [
          { date: '2026-08-05', amount: 600, note: 'Monthly savings' }
        ]
      }
    ];

    const budgets = DEFAULT_BUDGET_CATEGORIES;

    // Generate transactions for past 6 months
    const txs = [];
    const now = new Date();

    const sampleRecipients = {
      'Food & Grocery': ['Whole Foods Market', 'Trader Joe\'s', 'Organic Valley Store', 'Starbucks Coffee', 'Uber Eats'],
      'Transportation': ['Shell Gas Station', 'Uber Ride', 'Metro Transit Pass', 'Tesla Supercharger'],
      'Entertainment': ['Netflix Subscription', 'Cinema IMAX Tickets', 'Spotify Premium', 'Steam Games'],
      'Healthcare': ['City Care Pharmacy', 'Dental Clinic', 'Optometry Center', 'Health Insurance'],
      'Shopping': ['Apple Store', 'Amazon Prime', 'Nike Store', 'IKEA Furnishings'],
      'Bills & Utilities': ['Power & Electric Co.', 'High-speed Fiber Internet', 'Water & Waste Dept'],
      'Travel': ['Delta Airlines', 'Airbnb Tokyo', 'Marriott Hotels'],
      'Salary': ['H007 Solutions Corp - Payroll', 'H007 Solutions Corp - Payroll'],
      'Freelance': ['FinTech Consulting Client', 'Design Systems Advisory'],
      'Rental Income': ['Apartment 4B Rental', 'Apartment 4B Rental'],
      'Investments': ['Vanguard S&P Dividend', 'Index Growth Fund Dividend']
    };

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const year = now.getFullYear();
      const month = now.getMonth() - monthOffset;
      const baseDate = new Date(year, month, 1);

      // Monthly Fixed Income
      txs.push({
        id: `tx_sal_${monthOffset}`,
        type: 'income',
        amount: 6800,
        category: 'Salary',
        recipientName: 'H007 Solutions Corp - Payroll',
        status: 'completed',
        date: new Date(year, month, 1, 9, 0).toISOString(),
        notes: 'Monthly regular salary credit',
        isFixed: true,
        createdAt: baseDate.toISOString()
      });

      txs.push({
        id: `tx_rent_${monthOffset}`,
        type: 'income',
        amount: 1400,
        category: 'Rental Income',
        recipientName: 'Apartment 4B Rental',
        status: 'completed',
        date: new Date(year, month, 5, 10, 30).toISOString(),
        notes: 'Monthly property rent',
        isFixed: true,
        createdAt: baseDate.toISOString()
      });

      // Monthly Variable Income
      if (monthOffset % 2 === 0) {
        txs.push({
          id: `tx_free_${monthOffset}`,
          type: 'income',
          amount: 1250 + (monthOffset * 180),
          category: 'Freelance',
          recipientName: 'FinTech Consulting Client',
          status: 'completed',
          date: new Date(year, month, 14, 15, 0).toISOString(),
          notes: 'Advisory retainer milestone 2',
          isFixed: false,
          createdAt: baseDate.toISOString()
        });
      }

      if (monthOffset % 3 === 0) {
        txs.push({
          id: `tx_inv_${monthOffset}`,
          type: 'income',
          amount: 450 + (monthOffset * 90),
          category: 'Investments',
          recipientName: 'Vanguard S&P Dividend',
          status: 'completed',
          date: new Date(year, month, 20, 11, 15).toISOString(),
          notes: 'Quarterly dividend payout',
          isFixed: false,
          createdAt: baseDate.toISOString()
        });
      }

      // Monthly Expenses
      const expenses = [
        { cat: 'Food & Grocery', name: 'Whole Foods Market', amt: 220 + (monthOffset * 15), day: 3 },
        { cat: 'Food & Grocery', name: 'Trader Joe\'s', amt: 145, day: 12 },
        { cat: 'Food & Grocery', name: 'Starbucks Coffee', amt: 35, day: 16 },
        { cat: 'Food & Grocery', name: 'Uber Eats', amt: 65, day: 22 },
        { cat: 'Bills & Utilities', name: 'Power & Electric Co.', amt: 180, day: 4 },
        { cat: 'Bills & Utilities', name: 'High-speed Fiber Internet', amt: 85, day: 7 },
        { cat: 'Transportation', name: 'Tesla Supercharger', amt: 60, day: 8 },
        { cat: 'Transportation', name: 'Uber Ride', amt: 45, day: 19 },
        { cat: 'Entertainment', name: 'Netflix Subscription', amt: 22.99, day: 10 },
        { cat: 'Entertainment', name: 'Cinema IMAX Tickets', amt: 48, day: 18 },
        { cat: 'Healthcare', name: 'City Care Pharmacy', amt: 95, day: 15 },
        { cat: 'Healthcare', name: 'Health Insurance', amt: 220, day: 25 },
        { cat: 'Shopping', name: 'Amazon Prime', amt: 140, day: 11 },
        { cat: 'Travel', name: 'Delta Airlines', amt: 320, day: 23 }
      ];

      expenses.forEach((e, idx) => {
        // keep within actual days
        const day = Math.min(e.day, 28);
        txs.push({
          id: `tx_exp_${monthOffset}_${idx}`,
          type: 'expense',
          amount: e.amt,
          category: e.cat,
          recipientName: e.name,
          status: 'completed',
          date: new Date(year, month, day, 14, 20).toISOString(),
          notes: `${e.cat} expense`,
          isFixed: false,
          createdAt: baseDate.toISOString()
        });
      });
    }

    // Add recent pending and failed transactions for realistic status variety
    txs.unshift({
      id: 'tx_recent_pending',
      type: 'expense',
      amount: 189.50,
      category: 'Shopping',
      recipientName: 'Apple Store Online',
      status: 'pending',
      date: new Date().toISOString(),
      notes: 'USB-C accessories order',
      isFixed: false,
      createdAt: new Date().toISOString()
    });

    txs.unshift({
      id: 'tx_recent_failed',
      type: 'expense',
      amount: 79.00,
      category: 'Entertainment',
      recipientName: 'Live Concert Ticketmaster',
      status: 'failed',
      date: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: 'Payment gateway timeout',
      isFixed: false,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: 'light', currency: '$' }));
  }

  resetAllData() {
    localStorage.clear();
    this.seedInitialData();
  }
}

export const store = new Store();
