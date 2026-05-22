import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class DashboardPage extends Component {
  constructor(containerIdOrElement) {
    super(containerIdOrElement);
    this.watch(['transactions', 'pendingOrders', 'products', 'cart', 'activeLanguage']);
    this.render();
  }

  renderMetric(label, value, icon, tone = 'orange', change = '') {
    const tones = {
      orange: 'from-orange-500 to-orange-600',
      green: 'from-emerald-500 to-emerald-600',
      blue: 'from-sky-500 to-sky-600',
      amber: 'from-amber-500 to-amber-600',
    };

    return `
      <article class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 transition-colors duration-150 group">
        <div class="flex items-start justify-between">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">${escapeHtml(label)}</p>
            <p class="text-3xl font-black text-gray-950 dark:text-white tracking-tight">${escapeHtml(value)}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200">
            <i class="fa-solid ${icon} text-sm"></i>
          </div>
        </div>
      </article>
    `;
  }

  render() {
    const { transactions, pendingOrders, products, cart } = store.state;
    const activeTransactions = transactions.filter(tx => !tx.refunded);
    const refundedTransactions = transactions.filter(tx => tx.refunded);
    const totalSales = activeTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const avgOrder = activeTransactions.length > 0 ? totalSales / activeTransactions.length : 0;
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const recentTransactions = transactions.slice(0, 6);

    this.setHtml(`
      <div class="p-4 sm:p-6 space-y-6 animate-page-enter">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">Dashboard</h2>
            <p class="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Welcome back! Here's your overview.</p>
          </div>
          <button class="go-pos-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all active:scale-95">
            <i class="fa-solid fa-cash-register"></i>
            Open POS
          </button>
        </div>

        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          ${this.renderMetric('Total Sales', i18n.formatCurrency(totalSales), 'fa-chart-line', 'green')}
          ${this.renderMetric('Transactions', String(activeTransactions.length), 'fa-receipt', 'orange')}
          ${this.renderMetric('Avg. Order', i18n.formatCurrency(avgOrder), 'fa-calculator', 'blue')}
          ${this.renderMetric('Pending', String(pendingOrders.length), 'fa-pause', 'amber')}
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div class="p-4 sm:p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 class="font-bold text-gray-950 dark:text-white text-sm sm:text-base">Recent Transactions</h3>
              <button class="go-transactions-btn text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">View all</button>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-neutral-800">
              ${recentTransactions.length === 0 ? `
                <div class="p-10 text-center text-gray-400 dark:text-neutral-500">
                  <i class="fa-solid fa-receipt text-4xl mb-3 block opacity-20"></i>
                  <p class="text-sm font-medium">No transactions yet</p>
                  <p class="text-xs mt-1">Complete your first sale to see it here.</p>
                </div>
              ` : recentTransactions.map(tx => `
                <div class="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.paymentMethod === 'Cash' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                      tx.paymentMethod === 'Card Reader' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }">
                      <i class="fa-solid ${
                        tx.paymentMethod === 'Cash' ? 'fa-money-bill-wave' :
                        tx.paymentMethod === 'Card Reader' ? 'fa-credit-card' :
                        'fa-bolt'
                      } text-xs"></i>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-gray-950 dark:text-white truncate">${escapeHtml(tx.id)}</p>
                      <p class="text-[11px] text-gray-500 dark:text-neutral-400">${escapeHtml(i18n.formatDate(tx.timestamp))}</p>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold ${tx.refunded ? 'text-red-500 line-through' : 'text-gray-950 dark:text-white'}">${escapeHtml(i18n.formatCurrency(tx.total))}</p>
                    <p class="text-[11px] text-gray-400 dark:text-neutral-500">${escapeHtml(tx.paymentMethod)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <div class="space-y-4">
            <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
              <h3 class="font-bold text-gray-950 dark:text-white text-sm sm:text-base mb-4">Quick Stats</h3>
              <div class="space-y-2.5">
                <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-800/50 text-sm">
                  <span class="text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                    <i class="fa-solid fa-basket-shopping text-orange-500 text-xs"></i>
                    Cart items
                  </span>
                  <strong class="text-gray-950 dark:text-white">${cartItems}</strong>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-800/50 text-sm">
                  <span class="text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                    <i class="fa-solid fa-box text-blue-500 text-xs"></i>
                    Catalog
                  </span>
                  <strong class="text-gray-950 dark:text-white">${products.length}</strong>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-800/50 text-sm">
                  <span class="text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                    <i class="fa-solid fa-rotate-left text-red-500 text-xs"></i>
                    Refunded
                  </span>
                  <strong class="text-gray-950 dark:text-white">${refundedTransactions.length}</strong>
                </div>
              </div>
            </section>

            <section class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <i class="fa-solid fa-bolt text-sm"></i>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-white/70">Lightning Ready</p>
                  <p class="text-sm font-bold">Bitcoin Payments</p>
                </div>
              </div>
              <p class="text-xs text-white/70 leading-relaxed">Accept instant Bitcoin Lightning payments with zero hassle.</p>
            </section>
          </div>
        </div>
      </div>
    `);

    this.on('click', '.go-pos-btn', () => store.setRoute('pos'));
    this.on('click', '.go-transactions-btn', () => store.setRoute('transactions'));
  }
}
