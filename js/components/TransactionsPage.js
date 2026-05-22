import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class TransactionsPage extends Component {
  constructor(containerId) {
    super(containerId);
    this.searchQuery = '';
    this.watch(['currentRoute', 'transactions', 'activeLanguage']);
    this.render();
  }

  bindEvents() {
    this.on('input', '.transactions-search', event => {
      this.searchQuery = event.target.value;
      this.render();
    });

    this.on('click', '.refund-transaction-btn', async (_event, button) => {
      const txId = button.getAttribute('data-id');
      if (txId && confirm(`Refund transaction ${txId}?`)) {
        await store.refundTransaction(txId);
      }
    });
  }

  render() {
    if (store.state.currentRoute !== 'transactions') {
      this.setHtml('');
      return;
    }

    const query = this.searchQuery.trim().toLowerCase();
    const transactions = store.state.transactions.filter(tx => {
      if (!query) return true;
      return tx.id.toLowerCase().includes(query) ||
        tx.paymentMethod.toLowerCase().includes(query) ||
        tx.items.some(item => item.name.toLowerCase().includes(query));
    });

    const activeTransactions = store.state.transactions.filter(tx => !tx.refunded);
    const totalSales = activeTransactions.reduce((sum, tx) => sum + tx.total, 0);

    this.setHtml(`
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">Sales Ledger</p>
            <h2 class="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">Transactions</h2>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 py-3">
              <p class="text-gray-500 dark:text-neutral-400">Total sales</p>
              <p class="font-black text-gray-950 dark:text-white">${escapeHtml(i18n.formatCurrency(totalSales))}</p>
            </div>
            <div class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 py-3">
              <p class="text-gray-500 dark:text-neutral-400">Orders</p>
              <p class="font-black text-gray-950 dark:text-white">${activeTransactions.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-gray-100 dark:border-neutral-800">
            <input
              class="transactions-search w-full sm:max-w-md px-4 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Search id, item, or payment method"
              value="${escapeHtml(this.searchQuery)}"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-neutral-950 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                <tr>
                  <th class="px-4 py-3">Order</th>
                  <th class="px-4 py-3">Items</th>
                  <th class="px-4 py-3">Payment</th>
                  <th class="px-4 py-3 text-right">Total</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-neutral-800">
                ${transactions.length === 0 ? `
                  <tr>
                    <td colspan="5" class="px-4 py-10 text-center text-gray-500 dark:text-neutral-400">No transactions found.</td>
                  </tr>
                ` : transactions.map(tx => `
                  <tr>
                    <td class="px-4 py-4">
                      <p class="font-bold text-gray-950 dark:text-white">${escapeHtml(tx.id)}</p>
                      <p class="text-xs text-gray-500 dark:text-neutral-400">${escapeHtml(i18n.formatDate(tx.timestamp))}</p>
                    </td>
                    <td class="px-4 py-4 text-gray-600 dark:text-neutral-300">
                      ${tx.items.map(item => `${escapeHtml(item.name)} x${item.quantity}`).join('<br>')}
                    </td>
                    <td class="px-4 py-4">${escapeHtml(tx.paymentMethod)}</td>
                    <td class="px-4 py-4 text-right font-black ${tx.refunded ? 'text-red-500 line-through' : 'text-gray-950 dark:text-white'}">${escapeHtml(i18n.formatCurrency(tx.total))}</td>
                    <td class="px-4 py-4 text-right">
                      ${tx.refunded ? `
                        <span class="text-xs font-bold text-red-500">Refunded</span>
                      ` : `
                        <button data-id="${escapeHtml(tx.id)}" class="refund-transaction-btn px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-500/10 text-xs font-bold transition">Refund</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `);

    this.bindEvents();
  }
}
