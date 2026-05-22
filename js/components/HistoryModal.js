// Transaction History, Dashboard, and Receipts Modal Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class HistoryModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('activeModal', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    store.subscribe('transactions', () => this.render());

    // Local component state
    this.searchQuery = '';
    this.selectedTxId = null;
    this.activeTab = 'logs'; // 'logs' or 'dashboard'

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    if (store.state.activeModal !== 'history') return;

    // Tab switcher listeners
    const tabLogsBtn = this.container.querySelector('#tab-logs');
    const tabDashboardBtn = this.container.querySelector('#tab-dashboard');
    if (tabLogsBtn && tabDashboardBtn) {
      tabLogsBtn.addEventListener('click', () => {
        this.activeTab = 'logs';
        this.render();
      });
      tabDashboardBtn.addEventListener('click', () => {
        this.activeTab = 'dashboard';
        this.render();
      });
    }

    // Close buttons
    this.container.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        store.closeModal();
      });
    });

    // --- Logs Tab Events ---
    if (this.activeTab === 'logs') {
      const searchInput = this.container.querySelector('#history-search-input');
      if (searchInput) {
        searchInput.value = this.searchQuery;
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.renderListOnly();
        });
      }

      this.container.querySelectorAll('.order-row').forEach(row => {
        row.addEventListener('click', () => {
          const txId = row.getAttribute('data-id');
          this.selectedTxId = this.selectedTxId === txId ? null : txId;
          this.render();
        });
      });

      this.container.querySelectorAll('.refund-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const txId = btn.getAttribute('data-id');
          if (confirm(`Are you sure you want to refund order ${txId}?`)) {
            await store.refundTransaction(txId);
          }
        });
      });

      const clearHistoryBtn = this.container.querySelector('#clear-history-btn');
      if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
          if (confirm('CAUTION: This will delete ALL transaction records from local storage. Are you sure?')) {
            await store.clearHistory();
            this.selectedTxId = null;
          }
        });
      }
    }
  }

  // Calculate analytical stats for dashboard and summary widgets
  getDashboardStats() {
    const { transactions } = store.state;
    const activeTxs = transactions.filter(t => !t.refunded);
    const refundedTxs = transactions.filter(t => t.refunded);

    const totalSales = activeTxs.reduce((sum, t) => sum + t.total, 0);
    const orderCount = activeTxs.length;
    const refundCount = refundedTxs.length;
    const aov = orderCount > 0 ? (totalSales / orderCount) : 0;

    // Payment methods aggregation
    const payments = { Cash: 0, Card: 0, Lightning: 0 };
    activeTxs.forEach(t => {
      if (payments[t.paymentMethod] !== undefined) {
        payments[t.paymentMethod] += t.total;
      }
    });

    const paymentTotal = payments.Cash + payments.Card + payments.Lightning;
    const paymentPercentages = {
      Cash: paymentTotal > 0 ? (payments.Cash / paymentTotal) * 100 : 0,
      Card: paymentTotal > 0 ? (payments.Card / paymentTotal) * 100 : 0,
      Lightning: paymentTotal > 0 ? (payments.Lightning / paymentTotal) * 100 : 0
    };

    // Product counts aggregation
    const productSales = {};
    activeTxs.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, total: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].total += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { totalSales, orderCount, refundCount, aov, payments, paymentPercentages, topProducts };
  }

  // Generate dynamic, responsive inline SVG Line Chart
  renderSvgChart(activeTxs) {
    if (activeTxs.length === 0) {
      return `
        <div class="h-32 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400">
          <i class="fa-solid fa-chart-line text-xl mb-1.5"></i>
          <span class="text-[10px]">No sales data available for trend chart</span>
        </div>
      `;
    }

    // Sort transactions chronologically
    const sorted = [...activeTxs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Group transactions by hour
    const hourlyGroups = {};
    sorted.forEach(t => {
      const date = new Date(t.timestamp);
      const hourStr = `${String(date.getHours()).padStart(2, '0')}:00`;
      hourlyGroups[hourStr] = (hourlyGroups[hourStr] || 0) + t.total;
    });

    let labels = Object.keys(hourlyGroups);
    let values = Object.values(hourlyGroups);

    // Seed defaults if not enough points to draw a beautiful line
    if (labels.length < 2) {
      labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      values = [0, 0, 0, 0, 0, 0];
      if (Object.keys(hourlyGroups).length === 1) {
        // Put the lone value in the middle
        values[3] = Object.values(hourlyGroups)[0];
      }
    }

    // SVG coordinates computation
    const svgWidth = 550;
    const svgHeight = 140;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const maxValue = Math.max(...values, 10); // Ensure non-zero max scale

    const points = values.map((val, index) => {
      const x = paddingLeft + (index / (values.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - (val / maxValue) * plotHeight;
      return { x, y, value: val, label: labels[index] };
    });

    // Build SVG components
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

    const horizontalGridLines = [0, 0.5, 1].map(pct => {
      const y = paddingTop + plotHeight * pct;
      const labelVal = maxValue * (1 - pct);
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="currentColor" class="text-neutral-100 dark:text-neutral-800" stroke-width="1" stroke-dasharray="4 4" />
        <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" class="fill-neutral-400 dark:fill-neutral-500 font-mono text-[9px] font-bold">${i18n.formatCurrency(labelVal).split('.')[0]}</text>
      `;
    }).join('');

    const verticalAxisLines = points.map(p => `
      <text x="${p.x}" y="${paddingTop + plotHeight + 16}" text-anchor="middle" class="fill-neutral-400 dark:fill-neutral-500 font-semibold text-[9px]">${p.label}</text>
    `).join('');

    const circles = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" class="fill-orange-500 stroke-white dark:stroke-neutral-900" stroke-width="1.5" />
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" class="fill-neutral-700 dark:fill-neutral-200 font-bold text-[8px] opacity-0 hover:opacity-100 transition-opacity duration-150">${i18n.formatCurrency(p.value).split('.')[0]}</text>
    `).join('');

    return `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(249, 115, 22, 0.25)" />
            <stop offset="100%" stop-color="rgba(249, 115, 22, 0)" />
          </linearGradient>
        </defs>
        
        <!-- Grid System -->
        ${horizontalGridLines}
        ${verticalAxisLines}

        <!-- Gradient Area -->
        <path d="${fillPath}" fill="url(#chartGradient)" />

        <!-- Line Path -->
        <path d="${linePath}" fill="none" class="stroke-orange-500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Data Nodes -->
        ${circles}
      </svg>
    `;
  }

  // Filter transaction list based on search query
  getFilteredTransactions() {
    const { transactions } = store.state;
    return transactions.filter(t => {
      const idMatches = t.id.toLowerCase().includes(this.searchQuery.toLowerCase());
      const methodMatches = t.paymentMethod.toLowerCase().includes(this.searchQuery.toLowerCase());
      return idMatches || methodMatches;
    });
  }

  // Optimized search list renderer
  renderListOnly() {
    const listContainer = this.container.querySelector('#history-list-container');
    if (!listContainer) return;

    const filtered = this.getFilteredTransactions();

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="py-12 text-center text-neutral-400 dark:text-neutral-500">
          <i class="fa-solid fa-folder-open text-2xl mb-2"></i>
          <p class="text-sm font-semibold" data-i18n="history.no_transactions">${i18n.t('history.no_transactions')}</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(t => this.getOrderRowTemplate(t)).join('');
    
    // Rebind togglers
    this.container.querySelectorAll('.order-row').forEach(row => {
      row.addEventListener('click', () => {
        const txId = row.getAttribute('data-id');
        this.selectedTxId = this.selectedTxId === txId ? null : txId;
        this.render();
      });
    });

    this.container.querySelectorAll('.refund-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const txId = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to refund order ${txId}?`)) {
          await store.refundTransaction(txId);
        }
      });
    });
  }

  // Row template renderer helper
  getOrderRowTemplate(t) {
    const isSelected = this.selectedTxId === t.id;
    const formattedTotal = i18n.formatCurrency(t.total);
    const formattedDate = i18n.formatDate(t.timestamp);
    
    let statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 uppercase tracking-wide">Paid</span>`;
    if (t.refunded) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-500 uppercase tracking-wide" data-i18n="receipt.refunded">${i18n.t('receipt.refunded')}</span>`;
    }

    let itemsDetailsHtml = '';
    if (isSelected) {
      const itemsListHtml = t.items.map(item => `
        <div class="flex justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
          <span class="text-neutral-700 dark:text-neutral-300 font-medium">${item.name} <span class="text-neutral-400 font-normal">x${item.quantity}</span></span>
          <span class="font-bold text-neutral-900 dark:text-white">${i18n.formatCurrency(item.price * item.quantity)}</span>
        </div>
      `).join('');

      itemsDetailsHtml = `
        <div class="px-4 pb-4 pt-2 bg-neutral-50/50 dark:bg-neutral-950/20 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Order Items</span>
            ${itemsListHtml}
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-dashed border-neutral-250 dark:border-neutral-800">
            <div>
              <span class="text-neutral-400">Subtotal:</span>
              <span class="font-medium text-neutral-800 dark:text-neutral-200 ml-1">${i18n.formatCurrency(t.subtotal)}</span>
            </div>
            <div>
              <span class="text-neutral-400">Tax:</span>
              <span class="font-medium text-neutral-800 dark:text-neutral-200 ml-1">${i18n.formatCurrency(t.tax)}</span>
            </div>
            ${t.discount > 0 ? `
              <div>
                <span class="text-neutral-400">Discount:</span>
                <span class="font-medium text-green-500 ml-1">-${i18n.formatCurrency(t.discount)}</span>
              </div>
            ` : ''}
            <div>
              <span class="text-neutral-400">Payment:</span>
              <span class="font-medium text-neutral-800 dark:text-neutral-200 ml-1">${t.paymentMethod}</span>
            </div>
          </div>

          <!-- Refund action -->
          ${!t.refunded ? `
            <div class="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button 
                data-id="${t.id}"
                class="refund-btn py-1.5 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <i class="fa-solid fa-arrow-rotate-left text-[10px]"></i>
                <span data-i18n="history.refund">${i18n.t('history.refund')}</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="border border-neutral-100 dark:border-neutral-850 rounded-2xl overflow-hidden hover:border-orange-500/20 dark:hover:border-orange-500/10 transition-colors">
        <!-- Order Header Summary -->
        <div 
          data-id="${t.id}"
          class="order-row p-4 flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-950/45 cursor-pointer select-none transition-colors"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <span class="font-mono font-bold text-sm text-neutral-900 dark:text-white truncate">${t.id}</span>
              ${statusBadge}
            </div>
            <span class="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 block">${formattedDate}</span>
          </div>

          <div class="text-right flex items-center gap-3">
            <div>
              <span class="font-black text-neutral-950 dark:text-white text-base">${formattedTotal}</span>
              <span class="text-[10px] text-neutral-400 block">${t.paymentMethod}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-xs text-neutral-400 transition-transform ${isSelected ? 'rotate-180' : ''}"></i>
          </div>
        </div>

        <!-- Expanded Details -->
        ${itemsDetailsHtml}
      </div>
    `;
  }

  render() {
    if (store.state.activeModal !== 'history') {
      this.container.innerHTML = '';
      return;
    }

    const { totalSales, orderCount, refundCount, aov, paymentPercentages, topProducts } = this.getDashboardStats();
    const filtered = this.getFilteredTransactions();

    this.container.innerHTML = `
      <div class="fixed inset-0 bg-neutral-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-200 animate-fade-in">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 animate-scale-up relative p-6 max-h-[90vh] flex flex-col">
          
          <!-- Close button -->
          <button class="close-modal absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all z-10">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>

          <!-- History Title -->
          <h3 class="text-xl font-black text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
            <i class="fa-solid fa-chart-pie text-orange-500"></i>
            <span>Management & Analytics Dashboard</span>
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">View sales statistics, trends, and review raw transaction logs</p>

          <!-- Tabs Selector -->
          <div class="flex border-b border-neutral-100 dark:border-neutral-800 mb-5 text-sm">
            <button id="tab-logs" class="py-2 px-4 font-bold border-b-2 transition-all flex items-center gap-2 ${this.activeTab === 'logs' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}">
              <i class="fa-solid fa-list-ul"></i> Transaction Logs
            </button>
            <button id="tab-dashboard" class="py-2 px-4 font-bold border-b-2 transition-all flex items-center gap-2 ${this.activeTab === 'dashboard' ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}">
              <i class="fa-solid fa-chart-line"></i> Sales Analytics
            </button>
          </div>

          <!-- TAB CONTENT: logs -->
          ${this.activeTab === 'logs' ? `
            <!-- Logs Summary Statistics -->
            <div class="grid grid-cols-3 gap-3 mb-5 text-xs">
              <div class="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-150 dark:border-neutral-800/60">
                <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider" data-i18n="history.total_sales">${i18n.t('history.total_sales')}</span>
                <div class="text-lg font-black text-orange-600 dark:text-orange-500 mt-1">${i18n.formatCurrency(totalSales)}</div>
              </div>
              <div class="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-150 dark:border-neutral-800/60">
                <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider" data-i18n="history.order_count">${i18n.t('history.order_count')}</span>
                <div class="text-lg font-black text-green-600 dark:text-green-500 mt-1">${orderCount}</div>
              </div>
              <div class="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-150 dark:border-neutral-800/60">
                <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Refunds Count</span>
                <div class="text-lg font-black text-red-600 dark:text-red-500 mt-1">${refundCount}</div>
              </div>
            </div>

            <!-- Search and Clear Actions -->
            <div class="flex gap-2 mb-4">
              <div class="flex-1 relative text-xs">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <i class="fa-solid fa-magnifying-glass text-[11px]"></i>
                </div>
                <input 
                  type="text" 
                  id="history-search-input"
                  placeholder="Search receipt transaction code or payment method..." 
                  class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-750 focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white transition-all font-medium"
                />
              </div>

              ${store.state.transactions.length > 0 ? `
                <button 
                  id="clear-history-btn"
                  class="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/5 border border-red-500/20 dark:border-red-900/30 rounded-xl transition-all"
                  data-i18n="history.clear_history"
                >
                  ${i18n.t('history.clear_history')}
                </button>
              ` : ''}
            </div>

            <!-- Logs List Scroll container -->
            <div id="history-list-container" class="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
              ${filtered.length === 0 ? `
                <div class="py-12 text-center text-neutral-400 dark:text-neutral-500">
                  <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
                  <p class="text-sm font-semibold" data-i18n="history.no_transactions">${i18n.t('history.no_transactions')}</p>
                </div>
              ` : filtered.map(t => this.getOrderRowTemplate(t)).join('')}
            </div>
          ` : `
            <!-- TAB CONTENT: dashboard -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-6">
              
              <!-- Metrics grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div class="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/60">
                  <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Gross Turnover</span>
                  <div class="text-base font-black text-neutral-800 dark:text-white mt-1">${i18n.formatCurrency(totalSales)}</div>
                </div>
                <div class="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/60">
                  <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Transactions</span>
                  <div class="text-base font-black text-neutral-800 dark:text-white mt-1">${orderCount}</div>
                </div>
                <div class="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/60">
                  <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Average Ticket (AOV)</span>
                  <div class="text-base font-black text-neutral-800 dark:text-white mt-1">${i18n.formatCurrency(aov)}</div>
                </div>
                <div class="p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/60">
                  <span class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Refund Rate</span>
                  <div class="text-base font-black text-red-500 mt-1">${orderCount > 0 ? ((refundCount / (orderCount + refundCount)) * 100).toFixed(1) : 0}% (${refundCount})</div>
                </div>
              </div>

              <!-- Line Chart Trend -->
              <div class="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-3xl">
                <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fa-solid fa-chart-line text-orange-500"></i> Sales Hourly Trend
                </h4>
                ${this.renderSvgChart(store.state.transactions.filter(t => !t.refunded))}
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Payment methods proportions -->
                <div class="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-3xl text-xs flex flex-col justify-between">
                  <div>
                    <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                      <i class="fa-solid fa-credit-card text-indigo-500"></i> Payment Mix
                    </h4>
                    
                    <div class="space-y-4 mt-2">
                      <!-- Progress segmented stack -->
                      <div class="h-4 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
                        <div style="width: ${paymentPercentages.Cash}%" class="bg-emerald-500" title="Cash"></div>
                        <div style="width: ${paymentPercentages.Card}%" class="bg-indigo-500" title="Card"></div>
                        <div style="width: ${paymentPercentages.Lightning}%" class="bg-amber-500 animate-pulse" title="Lightning"></div>
                      </div>
                      
                      <!-- Legend / breakdowns -->
                      <div class="space-y-2">
                        <div class="flex justify-between items-center font-medium">
                          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-md bg-emerald-500"></span> Cash</span>
                          <span class="font-bold text-neutral-800 dark:text-neutral-250">${i18n.formatCurrency(paymentPercentages.Cash * totalSales / 100).split('.')[0]} (${paymentPercentages.Cash.toFixed(1)}%)</span>
                        </div>
                        <div class="flex justify-between items-center font-medium">
                          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-md bg-indigo-500"></span> Card Terminal</span>
                          <span class="font-bold text-neutral-800 dark:text-neutral-250">${i18n.formatCurrency(paymentPercentages.Card * totalSales / 100).split('.')[0]} (${paymentPercentages.Card.toFixed(1)}%)</span>
                        </div>
                        <div class="flex justify-between items-center font-medium">
                          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-md bg-amber-500"></span> BTC Lightning</span>
                          <span class="font-bold text-neutral-800 dark:text-neutral-250">${i18n.formatCurrency(paymentPercentages.Lightning * totalSales / 100).split('.')[0]} (${paymentPercentages.Lightning.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Top Selling Products -->
                <div class="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-3xl text-xs">
                  <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-fire text-amber-500"></i> Popular Menu Items
                  </h4>
                  
                  <div class="space-y-3 mt-3">
                    ${topProducts.length === 0 ? `
                      <div class="text-center py-6 text-neutral-400">No items sold yet</div>
                    ` : topProducts.map((p, idx) => {
                      const maxQty = topProducts[0].quantity;
                      const percent = maxQty > 0 ? (p.quantity / maxQty) * 100 : 0;
                      return `
                        <div class="space-y-1">
                          <div class="flex justify-between font-bold text-neutral-700 dark:text-neutral-300">
                            <span class="truncate">${idx + 1}. ${p.name}</span>
                            <span>${p.quantity} sold</span>
                          </div>
                          <div class="h-2 w-full rounded-full bg-neutral-150 dark:bg-neutral-800 overflow-hidden">
                            <div style="width: ${percent}%" class="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

              </div>

            </div>
          `}

          <!-- Close Footer Panel -->
          <div class="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4 flex-shrink-0">
            <button 
              class="close-modal w-full py-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 font-bold transition-all text-xs flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-750"
            >
              <span>Close Dashboard</span>
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }
}
export default HistoryModal;
