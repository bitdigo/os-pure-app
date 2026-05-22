// Checkout Modal Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class CheckoutModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('activeModal', () => this.render());
    store.subscribe('activeLanguage', () => this.render());

    // Local checkout component state
    this.checkoutStep = 'select_method'; // 'select_method', 'cash', 'card', 'lightning', 'success'
    this.cashReceived = '';
    this.simulatingPayment = false;
    this.simulationTimeout = null;
    this.createdTx = null;

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    if (store.state.activeModal !== 'checkout') return;

    // Close button
    const closeBtn = this.container.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.resetCheckout();
        store.closeModal();
      });
    }

    // Method selection cards
    this.container.querySelectorAll('.method-card').forEach(card => {
      card.addEventListener('click', () => {
        const method = card.getAttribute('data-method');
        this.setStep(method);
      });
    });

    // --- Cash Steps ---
    const cashInput = this.container.querySelector('#cash-received-input');
    if (cashInput) {
      cashInput.focus();
      cashInput.addEventListener('input', (e) => {
        this.cashReceived = e.target.value;
        this.updateCashChange();
      });
    }

    // Cash bills shortcut buttons
    this.container.querySelectorAll('.cash-bill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-val'));
        const { total } = store.getCartTotals();
        
        if (btn.getAttribute('data-action') === 'exact') {
          this.cashReceived = total.toFixed(2);
        } else {
          this.cashReceived = val.toFixed(2);
        }

        if (cashInput) {
          cashInput.value = this.cashReceived;
        }
        this.updateCashChange();
      });
    });

    // Complete cash transaction button
    const completeCashBtn = this.container.querySelector('#complete-cash-btn');
    if (completeCashBtn) {
      completeCashBtn.addEventListener('click', () => {
        const cashAmt = parseFloat(this.cashReceived);
        const { total } = store.getCartTotals();
        if (!isNaN(cashAmt) && cashAmt >= total) {
          this.completeTransaction('Cash', {
            received: cashAmt,
            change: cashAmt - total
          });
        } else {
          store.showToast(i18n.t('toast.invalid_amount'));
        }
      });
    }

    // --- Card simulation back button ---
    const backBtn = this.container.querySelector('.back-to-methods');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.resetSimulations();
        this.setStep('select_method');
      });
    }

    // --- Success State Buttons ---
    const doneBtn = this.container.querySelector('#success-done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        store.clearCart();
        this.resetCheckout();
        store.closeModal();
      });
    }

    const printBtn = this.container.querySelector('#success-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.printReceipt();
      });
    }
  }

  setStep(step) {
    this.checkoutStep = step;
    this.render();

    if (step === 'card') {
      this.simulateCardPayment();
    } else if (step === 'lightning') {
      this.simulateLightningPayment();
    }
  }

  resetCheckout() {
    this.checkoutStep = 'select_method';
    this.cashReceived = '';
    this.resetSimulations();
    this.createdTx = null;
  }

  resetSimulations() {
    this.simulatingPayment = false;
    if (this.simulationTimeout) {
      clearTimeout(this.simulationTimeout);
      this.simulationTimeout = null;
    }
  }

  updateCashChange() {
    const cashAmt = parseFloat(this.cashReceived);
    const { total } = store.getCartTotals();
    const changeEl = this.container.querySelector('#change-due-amount');
    const completeBtn = this.container.querySelector('#complete-cash-btn');
    
    if (changeEl) {
      if (!isNaN(cashAmt) && cashAmt >= total) {
        changeEl.textContent = i18n.formatCurrency(cashAmt - total);
        changeEl.classList.remove('text-red-500');
        changeEl.classList.add('text-green-600', 'dark:text-green-500');
        if (completeBtn) completeBtn.disabled = false;
      } else {
        changeEl.textContent = i18n.formatCurrency(0);
        changeEl.classList.add('text-red-500');
        changeEl.classList.remove('text-green-600', 'dark:text-green-500');
        if (completeBtn) completeBtn.disabled = true;
      }
    }
  }

  simulateCardPayment() {
    this.simulatingPayment = true;
    this.simulationTimeout = setTimeout(() => {
      this.completeTransaction('Card Reader', { authCode: Math.floor(100000 + Math.random() * 900000) });
    }, 2500);
  }

  simulateLightningPayment() {
    this.simulatingPayment = true;
    // Simulate invoice status check
    this.simulationTimeout = setTimeout(() => {
      store.showToast(i18n.t('toast.invoice_paid'));
      this.completeTransaction('Bitcoin Lightning', { 
        node: 'LN-Node-BitDigo-02c3', 
        preimage: 'e972183eefdae890c291bd670c5dfef9876426782...' 
      });
    }, 5000);
  }

  async completeTransaction(method, details) {
    const { subtotal, discount, tax, total } = store.getCartTotals();
    
    const tx = await store.addTransaction({
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: method,
      paymentDetails: details
    });

    this.createdTx = tx;
    this.setStep('success');
  }

  printReceipt() {
    if (!this.createdTx) return;
    
    // Create iframe for headless print layout
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    
    const isDark = store.state.theme === 'dark';
    
    const itemsHtml = this.createdTx.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>${item.name} x${item.quantity}</span>
        <span>${i18n.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('');

    doc.write(`
      <html>
        <head>
          <title>Receipt - ${this.createdTx.id}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              color: #000;
              font-size: 14px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; }
            .total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 18px;">${i18n.t('receipt.merchant')}</div>
          <div class="center">${i18n.t('receipt.address')}</div>
          <div class="divider"></div>
          <div class="row"><span>${i18n.t('receipt.invoice_id')}:</span><span>${this.createdTx.id}</span></div>
          <div class="row"><span>${i18n.t('receipt.date')}:</span><span>${i18n.formatDate(this.createdTx.timestamp)}</span></div>
          <div class="row"><span>${i18n.t('receipt.payment_method')}:</span><span>${this.createdTx.paymentMethod}</span></div>
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="row"><span>${i18n.t('cart.subtotal')}:</span><span>${i18n.formatCurrency(this.createdTx.subtotal)}</span></div>
          ${this.createdTx.discount > 0 ? `<div class="row"><span>${i18n.t('cart.discount')}:</span><span>-${i18n.formatCurrency(this.createdTx.discount)}</span></div>` : ''}
          <div class="row"><span>${i18n.t('cart.tax')}:</span><span>${i18n.formatCurrency(this.createdTx.tax)}</span></div>
          <div class="divider"></div>
          <div class="row total"><span>${i18n.t('cart.total')}:</span><span>${i18n.formatCurrency(this.createdTx.total)}</span></div>
          <div class="divider"></div>
          <div class="center bold" style="margin-top: 15px;">${i18n.t('receipt.thank_you')}</div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }

  // Helper to generate dynamic cash shortcuts depending on selected currency/locale
  getCashShortcuts(total) {
    let bills = [];
    switch (store.state.activeLanguage) {
      case 'th':
        bills = [20, 50, 100, 500, 1000];
        break;
      case 'es': // Euro
        bills = [5, 10, 20, 50, 100];
        break;
      default: // Dollar
        bills = [5, 10, 20, 50, 100];
    }
    
    // Filter bills that are greater than or equal to total, and sort
    const validBills = bills.filter(b => b >= total).slice(0, 3);
    
    // Always include exact amount
    const shortcuts = [{ label: 'Exact', val: total, action: 'exact' }];
    validBills.forEach(b => {
      shortcuts.push({ label: `${b}`, val: b });
    });

    // If no valid bills (e.g. total is large), offer double/triple options or round up
    if (shortcuts.length === 1) {
      const nextTen = Math.ceil(total / 10) * 10;
      const nextFifty = Math.ceil(total / 50) * 50;
      const nextHundred = Math.ceil(total / 100) * 100;
      shortcuts.push({ label: `${nextTen}`, val: nextTen });
      if (nextFifty > nextTen) shortcuts.push({ label: `${nextFifty}`, val: nextFifty });
      if (nextHundred > nextFifty) shortcuts.push({ label: `${nextHundred}`, val: nextHundred });
    }

    return shortcuts;
  }

  render() {
    if (store.state.activeModal !== 'checkout') {
      this.container.innerHTML = '';
      return;
    }

    const { total } = store.getCartTotals();
    const formattedTotal = i18n.formatCurrency(total);

    // Mock BTC exchange rate $65,000 for Lightning Sat calculation
    const exchangeRate = 65000; 
    const satsAmount = Math.round((total / exchangeRate) * 100000000);
    const mockLightningInvoice = `lnbc${satsAmount}n1pvjlxpqpp58m9y2euv3k9w...`;

    let stepHtml = '';

    if (this.checkoutStep === 'select_method') {
      stepHtml = `
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6" data-i18n="checkout.select_method">
          ${i18n.t('checkout.select_method')}
        </h3>
        
        <div class="grid grid-cols-1 gap-4">
          <!-- Cash Payment -->
          <div 
            data-method="cash"
            class="method-card group p-5 border border-gray-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500 dark:hover:border-orange-500/50 hover:bg-orange-500/5 transition-all active:scale-[0.98]"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-money-bill-wave"></i>
              </div>
              <div class="text-left">
                <h4 class="font-bold text-gray-900 dark:text-white text-base" data-i18n="checkout.cash">${i18n.t('checkout.cash')}</h4>
                <p class="text-xs text-gray-500 dark:text-neutral-400">Pay using physical notes and coins</p>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-400 group-hover:text-orange-500 transition-colors"></i>
          </div>

          <!-- Card Payment -->
          <div 
            data-method="card"
            class="method-card group p-5 border border-gray-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500 dark:hover:border-orange-500/50 hover:bg-orange-500/5 transition-all active:scale-[0.98]"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-credit-card"></i>
              </div>
              <div class="text-left">
                <h4 class="font-bold text-gray-900 dark:text-white text-base" data-i18n="checkout.card">${i18n.t('checkout.card')}</h4>
                <p class="text-xs text-gray-500 dark:text-neutral-400">Visa, Mastercard, contactless swipe</p>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-400 group-hover:text-orange-500 transition-colors"></i>
          </div>

          <!-- Bitcoin Lightning Payment -->
          <div 
            data-method="lightning"
            class="method-card group p-5 border border-gray-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500 dark:hover:border-orange-500/50 hover:bg-orange-500/5 transition-all active:scale-[0.98]"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="text-left">
                <h4 class="font-bold text-gray-900 dark:text-white text-base" data-i18n="checkout.lightning">${i18n.t('checkout.lightning')}</h4>
                <p class="text-xs text-gray-500 dark:text-neutral-400">Instant, micro-fee layer 2 Bitcoin payment</p>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-400 group-hover:text-orange-500 transition-colors"></i>
          </div>
        </div>
      `;
    } else if (this.checkoutStep === 'cash') {
      const shortcuts = this.getCashShortcuts(total);
      stepHtml = `
        <div class="flex items-center gap-2 mb-6">
          <button class="back-to-methods p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white" data-i18n="checkout.cash">
            ${i18n.t('checkout.cash')}
          </h3>
        </div>

        <div class="space-y-5">
          <!-- Total Label -->
          <div class="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-500 dark:text-neutral-400" data-i18n="checkout.amount_due">${i18n.t('checkout.amount_due')}</span>
            <span class="text-2xl font-black text-gray-950 dark:text-white">${formattedTotal}</span>
          </div>

          <!-- Cash Input -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-500 dark:text-neutral-400" data-i18n="checkout.cash_received">${i18n.t('checkout.cash_received')}</label>
            <div class="relative">
              <input 
                type="number" 
                id="cash-received-input"
                step="0.01"
                value="${this.cashReceived}"
                placeholder="0.00" 
                class="w-full text-right text-2xl font-bold py-3 pl-4 pr-12 rounded-2xl bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                ${activeLanguage === 'th' ? '฿' : activeLanguage === 'es' ? '€' : '$'}
              </span>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="grid grid-cols-4 gap-2">
            ${shortcuts.map(s => `
              <button 
                data-val="${s.val}"
                data-action="${s.action || ''}"
                class="cash-bill-btn py-2.5 rounded-xl font-extrabold text-sm transition-all border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-500/5"
              >
                ${s.action === 'exact' ? i18n.t('checkout.exact') || 'Exact' : `${s.label}`}
              </button>
            `).join('')}
          </div>

          <!-- Change Due -->
          <div class="p-4 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-500 dark:text-neutral-400" data-i18n="checkout.change_due">${i18n.t('checkout.change_due')}</span>
            <span id="change-due-amount" class="text-xl font-bold text-red-500">
              ${i18n.formatCurrency(0)}
            </span>
          </div>

          <!-- Complete Button -->
          <button 
            id="complete-cash-btn"
            disabled
            class="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-circle-check"></i>
            <span data-i18n="checkout.complete">${i18n.t('checkout.complete')}</span>
          </button>
        </div>
      `;
    } else if (this.checkoutStep === 'card') {
      stepHtml = `
        <div class="flex items-center gap-2 mb-6">
          <button class="back-to-methods p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white" data-i18n="checkout.card">
            ${i18n.t('checkout.card')}
          </h3>
        </div>

        <div class="py-12 flex flex-col items-center justify-center text-center space-y-6">
          <!-- Card Reader Loading Spinner -->
          <div class="relative w-24 h-24 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-blue-500/10 animate-pulse"></div>
            <div class="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <i class="fa-solid fa-credit-card text-3xl text-blue-500"></i>
          </div>

          <div>
            <h4 class="font-bold text-gray-900 dark:text-white text-lg">Connecting to Reader</h4>
            <p class="text-sm text-gray-500 dark:text-neutral-400 mt-1" data-i18n="checkout.status_pending">${i18n.t('checkout.status_pending')}</p>
          </div>

          <div class="w-full p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl text-center">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount Request</span>
            <div class="text-2xl font-black text-gray-950 dark:text-white mt-1">${formattedTotal}</div>
          </div>
        </div>
      `;
    } else if (this.checkoutStep === 'lightning') {
      // Direct integration QR Server
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockLightningInvoice)}`;
      
      stepHtml = `
        <div class="flex items-center gap-2 mb-6">
          <button class="back-to-methods p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white" data-i18n="checkout.lightning">
            ${i18n.t('checkout.lightning')}
          </h3>
        </div>

        <div class="flex flex-col items-center justify-center space-y-6">
          <!-- Sat conversion -->
          <div class="w-full flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div class="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <i class="fa-solid fa-bolt text-lg led-pulse w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"></i>
              <span class="text-sm font-bold" data-i18n="checkout.sats_equivalent">${i18n.t('checkout.sats_equivalent')}</span>
            </div>
            <span class="font-extrabold text-amber-600 dark:text-amber-500 text-lg">
              ${i18n.formatSats(satsAmount)}
            </span>
          </div>

          <!-- QR Code Container -->
          <div class="p-4 bg-white rounded-3xl shadow-inner border border-gray-100 flex items-center justify-center w-56 h-56">
            <img src="${qrUrl}" alt="Lightning QR Code" class="w-48 h-48" />
          </div>

          <div class="text-center space-y-1">
            <h4 class="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <i class="fa-solid fa-spinner animate-spin text-sm text-amber-500"></i>
              <span data-i18n="checkout.status_pending">${i18n.t('checkout.status_pending')}</span>
            </h4>
            <p class="text-xs text-gray-500 dark:text-neutral-400 max-w-xs" data-i18n="checkout.ln_invoice_info">
              ${i18n.t('checkout.ln_invoice_info')}
            </p>
          </div>

          <!-- Invoice copy field -->
          <div class="w-full relative flex items-center">
            <input 
              type="text" 
              readonly
              value="${mockLightningInvoice}"
              class="w-full pr-12 pl-4 py-2 text-xs font-mono rounded-xl bg-gray-100 dark:bg-neutral-800 border-none outline-none text-gray-600 dark:text-neutral-400"
            />
            <button 
              onclick="navigator.clipboard.writeText('${mockLightningInvoice}'); store.showToast('Invoice copied!');"
              class="absolute right-2 px-3 py-1 rounded-lg bg-white dark:bg-neutral-700 shadow-sm text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      `;
    } else if (this.checkoutStep === 'success') {
      stepHtml = `
        <div class="py-6 flex flex-col items-center justify-center text-center space-y-6">
          <!-- Animated Checkmark -->
          <div class="success-checkmark">
            <div class="check-icon">
              <span class="icon-line line-tip"></span>
              <span class="icon-line line-long"></span>
              <div class="icon-circle"></div>
              <div class="icon-fix"></div>
            </div>
          </div>

          <div>
            <h4 class="font-black text-2xl text-gray-900 dark:text-white" data-i18n="checkout.status_success">
              ${i18n.t('checkout.status_success')}
            </h4>
            <p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">Transaction Completed Successfully</p>
          </div>

          <!-- Details Card -->
          <div class="w-full border border-dashed border-gray-200 dark:border-neutral-800 rounded-3xl p-4 text-left space-y-2 text-sm text-gray-600 dark:text-neutral-400">
            <div class="flex justify-between font-bold text-gray-900 dark:text-white border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2 mb-2">
              <span>Order ID:</span>
              <span class="font-mono text-xs">${this.createdTx ? this.createdTx.id : ''}</span>
            </div>
            <div class="flex justify-between">
              <span>Method:</span>
              <span class="font-medium text-gray-900 dark:text-white">${this.createdTx ? this.createdTx.paymentMethod : ''}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Paid:</span>
              <span class="font-bold text-orange-500">${this.createdTx ? i18n.formatCurrency(this.createdTx.total) : ''}</span>
            </div>
          </div>

          <!-- Buttons -->
          <div class="grid grid-cols-2 gap-3 w-full">
            <button 
              id="success-print-btn"
              class="py-3 px-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-bold transition-all flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-print"></i>
              <span data-i18n="receipt.print">${i18n.t('receipt.print')}</span>
            </button>
            <button 
              id="success-done-btn"
              class="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-arrow-right"></i>
              <span data-i18n="receipt.close">${i18n.t('receipt.close')}</span>
            </button>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-fade-in">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 animate-scale-up relative p-6">
          
          <!-- Top Cancel/Close X Button (hidden in success step to enforce closing properly) -->
          ${this.checkoutStep !== 'success' ? `
            <button class="close-modal absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          ` : ''}

          <!-- Step Content -->
          ${stepHtml}
        </div>
      </div>
    `;

    this.bindEvents();
  }
}
export default CheckoutModal;
