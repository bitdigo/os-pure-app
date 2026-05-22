import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class DashboardPage extends Component {
  constructor(containerId) {
    super(containerId);
    this.watch(['currentRoute', 'transactions', 'pendingOrders', 'products', 'cart', 'activeLanguage']);
    this.render();
  }

  renderMetric(label, value, icon, tone = 'orange') {
    const tones = {
      orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    };

    return `
      <article class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">${escapeHtml(label)}</p>
            <p class="text-2xl font-black text-gray-950 dark:text-white mt-2">${escapeHtml(value)}</p>
          </div>
          <div class="w-11 h-11 rounded-2xl ${tones[tone]} flex items-center justify-center">
            <i class="fa-solid ${icon}"></i>
          </div>
        </div>
      </article>
    `;
  }

  render() {
    if (store.state.currentRoute !== 'dashboard') {
      this.setHtml('');
      return;
    }

    const { transactions, pendingOrders, products, cart } = store.state;
    const activeTransactions = transactions.filter(tx => !tx.refunded);
    const refundedTransactions = transactions.filter(tx => tx.refunded);
    const totalSales = activeTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const recentTransactions = transactions.slice(0, 5);

    this.setHtml(`
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">Overview</p>
            <h2 class="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">Dashboard</h2>
          </div>
          <button class="go-pos-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition">
            <i class="fa-solid fa-cash-register"></i>
            Open POS
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          ${this.renderMetric('Total sales', i18n.formatCurrency(totalSales), 'fa-chart-line', 'green')}
          ${this.renderMetric('Transactions', String(activeTransactions.length), 'fa-receipt', 'orange')}
          ${this.renderMetric('Pending orders', String(pendingOrders.length), 'fa-pause', 'amber')}
          ${this.renderMetric('Catalog items', String(products.length), 'fa-store', 'blue')}
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
          <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div class="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 class="font-black text-gray-950 dark:text-white">Recent Transactions</h3>
              <button class="go-transactions-btn text-sm font-bold text-orange-600 dark:text-orange-400">View all</button>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-neutral-800">
              ${recentTransactions.length === 0 ? `
                <div class="p-8 text-center text-gray-500 dark:text-neutral-400">No transactions yet.</div>
              ` : recentTransactions.map(tx => `
                <div class="p-4 flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <p class="font-bold text-gray-950 dark:text-white truncate">${escapeHtml(tx.id)}</p>
                    <p class="text-xs text-gray-500 dark:text-neutral-400">${escapeHtml(i18n.formatDate(tx.timestamp))}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-black ${tx.refunded ? 'text-red-500 line-through' : 'text-gray-950 dark:text-white'}">${escapeHtml(i18n.formatCurrency(tx.total))}</p>
                    <p class="text-xs text-gray-500 dark:text-neutral-400">${escapeHtml(tx.paymentMethod)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 class="font-black text-gray-950 dark:text-white">Today Workspace</h3>
            <div class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500 dark:text-neutral-400">Items in current cart</span>
                <strong>${cartItems}</strong>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500 dark:text-neutral-400">Refunded transactions</span>
                <strong>${refundedTransactions.length}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    `);

    this.on('click', '.go-pos-btn', () => store.setRoute('pos'));
    this.on('click', '.go-transactions-btn', () => store.setRoute('transactions'));
  }
}
