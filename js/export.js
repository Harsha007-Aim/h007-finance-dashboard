/**
 * H007 Solutions Personal Finance Dashboard - Export Module
 * Handles CSV export and Print/PDF generation
 */

import { store } from './store.js';

export function exportTransactionsCSV(options = {}) {
  const txs = store.getTransactions();
  if (!txs || txs.length === 0) {
    alert('No transactions to export.');
    return;
  }

  // Filter based on options if provided
  let filtered = [...txs];
  if (options.type && options.type !== 'all') {
    filtered = filtered.filter(t => t.type === options.type);
  }
  if (options.startDate) {
    const start = new Date(options.startDate).getTime();
    filtered = filtered.filter(t => new Date(t.date).getTime() >= start);
  }
  if (options.endDate) {
    const end = new Date(options.endDate).getTime() + 86400000;
    filtered = filtered.filter(t => new Date(t.date).getTime() <= end);
  }

  const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Recipient / Source', 'Amount ($)', 'Status', 'Notes'];
  const rows = filtered.map(t => [
    `"${t.id}"`,
    `"${new Date(t.date).toLocaleDateString()} ${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
    `"${t.type.toUpperCase()}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.recipientName.replace(/"/g, '""')}"`,
    t.type === 'income' ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
    `"${t.status.toUpperCase()}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `H007_Solutions_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printFinancialReport(title = 'Monthly Financial Report') {
  window.print();
}
