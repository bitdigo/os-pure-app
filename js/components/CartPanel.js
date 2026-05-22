// Cart Panel Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class CartPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeTab = 'percent'; // 'percent', 'amount', 'coupon'
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('cart', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    
    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    // 1. Decrement Quantity Button
    this.container.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = store.state.cart.find(i => i.product.id === id);
        if (item) {
          store.updateCartQty(id, item.quantity - 1);
        }
      });
    });

    // 2. Increment Quantity Button
    this.container.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = store.state.cart.find(i => i.product.id === id);
        if (item) {
          store.updateCartQty(id, item.quantity + 1);
        }
      });
    });

    // 3. Remove Item Button
    this.container.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.removeFromCart(id);
      });
    });

    // 4. Clear Cart Button
    const clearBtn = this.container.querySelector('#clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        store.clearCart();
      });
    }

    // 5. Checkout Button
    const checkoutBtn = this.container.querySelector('#checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (store.state.cart.length > 0) {
          store.openModal('checkout');
        }
      });
    }

    // --- Tab selection listeners ---
    const tabPercent = this.container.querySelector('#tab-percent');
    if (tabPercent) {
      tabPercent.addEventListener('click', () => {
        this.activeTab = 'percent';
        this.render();
      });
    }
    const tabAmount = this.container.querySelector('#tab-amount');
    if (tabAmount) {
      tabAmount.addEventListener('click', () => {
        this.activeTab = 'amount';
        this.render();
      });
    }
    const tabCoupon = this.container.querySelector('#tab-coupon');
    if (tabCoupon) {
      tabCoupon.addEventListener('click', () => {
        this.activeTab = 'coupon';
        this.render();
      });
    }

    // --- Percentage preset buttons ---
    this.container.querySelectorAll('.discount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-val'), 10);
        store.setDiscountRate(val);
      });
    });

    // --- Custom percentage text input ---
    const customPercentInput = this.container.querySelector('#custom-discount-percent');
    if (customPercentInput) {
      customPercentInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          store.setCustomDiscount('percent', val);
        } else if (e.target.value === '') {
          store.setCustomDiscount('percent', 0);
        }
      });
    }

    // --- Custom flat amount input ---
    const customAmountInput = this.container.querySelector('#custom-discount-amount');
    const applyAmountBtn = this.container.querySelector('#apply-amount-btn');
    const triggerAmountApply = () => {
      if (customAmountInput) {
        const val = parseFloat(customAmountInput.value);
        if (!isNaN(val) && val >= 0) {
          store.setCustomDiscount('amount', val);
        }
      }
    };
    if (applyAmountBtn) {
      applyAmountBtn.addEventListener('click', triggerAmountApply);
    }
    if (customAmountInput) {
      customAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          triggerAmountApply();
        }
      });
    }

    // --- Coupon input ---
    const couponInput = this.container.querySelector('#coupon-input');
    const applyCouponBtn = this.container.querySelector('#apply-coupon-btn');
    const removeCouponBtn = this.container.querySelector('#remove-coupon-btn');
    const triggerCouponApply = () => {
      if (couponInput) {
        const code = couponInput.value.trim();
        store.applyCoupon(code);
      }
    };
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', triggerCouponApply);
    }
    if (couponInput) {
      couponInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          triggerCouponApply();
        }
      });
    }
    if (removeCouponBtn) {
      removeCouponBtn.addEventListener('click', () => {
        store.removeCoupon();
        this.activeTab = 'coupon';
        this.render();
      });
    }
  }

  render() {
    if (!this.container) return;

    const { cart, activeLanguage, discountType, discountValue, appliedCoupon } = store.state;
    const { subtotal, discount, tax, total } = store.getCartTotals();
    const hasItems = cart.length > 0;

    const discountPresets = [0, 5, 10, 15, 20];
    const currencySymbol = activeLanguage === 'th' ? '฿' : (activeLanguage === 'es' ? '€' : '$');

    // Auto switch active tab to coupon if a coupon is active
    if (appliedCoupon) {
      this.activeTab = 'coupon';
    }

    this.container.innerHTML = `
      <div class="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 transition-colors duration-200">
        
        <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-receipt text-orange-500"></i>
            <h2 class="font-bold text-sm text-gray-900 dark:text-white" data-i18n="cart.title">${i18n.t('cart.title')}</h2>
          </div>
          ${hasItems ? `
            <button 
              id="clear-cart-btn" 
              class="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <i class="fa-solid fa-trash-can"></i>
              <span data-i18n="cart.clear">${i18n.t('cart.clear')}</span>
            </button>
          ` : ''}
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          ${!hasItems ? `
            <div class="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-neutral-500 py-12">
              <div class="w-16 h-16 rounded-full bg-orange-500/5 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                <i class="fa-solid fa-basket-shopping text-2xl"></i>
              </div>
              <p class="font-semibold" data-i18n="cart.empty">${i18n.t('cart.empty')}</p>
            </div>
          ` : cart.map(item => `
            <div class="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-100 dark:border-neutral-800 transition-colors">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-sm text-gray-900 dark:text-white truncate">${item.product.name}</h4>
                <p class="text-xs text-orange-500 font-bold mt-1">${i18n.formatCurrency(item.product.price)}</p>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-800 p-1">
                <button 
                  data-id="${item.product.id}"
                  class="qty-minus w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <i class="fa-solid fa-minus text-xs"></i>
                </button>
                <span class="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">${item.quantity}</span>
                <button 
                  data-id="${item.product.id}"
                  class="qty-plus w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
                </button>
              </div>

              <!-- Remove Button -->
              <button 
                data-id="${item.product.id}" 
                class="remove-item p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Cart Footer / Totals -->
        <div class="p-4 bg-gray-50 dark:bg-neutral-950/50 border-t border-gray-200 dark:border-neutral-800 space-y-4">
          
          <!-- Discount Selector & Tabs -->
          ${hasItems ? `
            <div class="space-y-2">
              <label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                <i class="fa-solid fa-percent text-[10px]"></i>
                <span data-i18n="cart.discount">${i18n.t('cart.discount')}</span>
              </label>

              <!-- Tabs Header -->
              <div class="flex border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden text-[10px] font-bold">
                <button 
                  id="tab-percent"
                  class="flex-1 py-1.5 text-center transition-colors flex items-center justify-center gap-1 ${
                    this.activeTab === 'percent' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white dark:bg-neutral-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }"
                >
                  <i class="fa-solid fa-percent text-[8px]"></i>
                  <span data-i18n="cart.discount_percent">${i18n.t('cart.discount_percent')}</span>
                </button>
                
                <button 
                  id="tab-amount"
                  class="flex-1 py-1.5 text-center transition-colors flex items-center justify-center gap-1 ${
                    this.activeTab === 'amount' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white dark:bg-neutral-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }"
                >
                  <i class="fa-solid fa-calculator text-[8px]"></i>
                  <span data-i18n="cart.discount_amount">${i18n.t('cart.discount_amount')}</span>
                </button>
                
                <button 
                  id="tab-coupon"
                  class="flex-1 py-1.5 text-center transition-colors flex items-center justify-center gap-1 ${
                    this.activeTab === 'coupon' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white dark:bg-neutral-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }"
                >
                  <i class="fa-solid fa-ticket text-[8px]"></i>
                  <span data-i18n="cart.coupon_code">${i18n.t('cart.coupon_code')}</span>
                </button>
              </div>

              <!-- Tab Contents -->
              <div class="pt-1">
                ${this.activeTab === 'percent' ? `
                  <!-- Percentage Tab -->
                  <div class="flex gap-2 items-center animate-fade-in">
                    <div class="grid grid-cols-5 gap-1 flex-1">
                      ${discountPresets.map(preset => `
                        <button 
                          data-val="${preset}"
                          class="discount-btn py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            discountType === 'percent' && discountValue === preset && !appliedCoupon
                              ? 'bg-orange-500 text-white border-orange-500' 
                              : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }"
                        >
                          ${preset}%
                        </button>
                      `).join('')}
                    </div>
                    <input 
                      type="number" 
                      id="custom-discount-percent"
                      min="0"
                      max="100"
                      placeholder="Custom %"
                      value="${discountType === 'percent' && !appliedCoupon ? discountValue : ''}"
                      class="w-20 px-2 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                  </div>
                ` : this.activeTab === 'amount' ? `
                  <!-- Amount Tab -->
                  <div class="relative flex items-center animate-fade-in">
                    <span class="absolute left-3 text-xs font-black text-gray-400">${currencySymbol}</span>
                    <input 
                      type="number" 
                      id="custom-discount-amount"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value="${discountType === 'amount' && !appliedCoupon ? discountValue : ''}"
                      class="w-full pl-7 pr-16 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                    <button 
                      id="apply-amount-btn" 
                      class="absolute right-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-md transition-colors"
                      data-i18n="cart.coupon_apply"
                    >
                      ${i18n.t('cart.coupon_apply')}
                    </button>
                  </div>
                ` : `
                  <!-- Coupon Tab -->
                  <div class="animate-fade-in">
                    ${appliedCoupon ? `
                      <div class="flex items-center justify-between p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                        <div class="flex items-center gap-1.5">
                          <i class="fa-solid fa-circle-check text-green-500 text-sm"></i>
                          <span>
                            <strong data-i18n="cart.coupon_applied_label">${i18n.t('cart.coupon_applied_label')}</strong>: 
                            <strong>${appliedCoupon.code}</strong> 
                            (${appliedCoupon.type === 'percent' ? appliedCoupon.value + '%' : i18n.formatCurrency(appliedCoupon.value)} off)
                          </span>
                        </div>
                        <button id="remove-coupon-btn" class="p-1 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    ` : `
                      <div class="relative flex items-center">
                        <input 
                          type="text" 
                          id="coupon-input"
                          data-i18n-attr="placeholder:cart.coupon_placeholder"
                          placeholder="${i18n.t('cart.coupon_placeholder')}"
                          class="w-full pl-3 pr-16 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white uppercase"
                        />
                        <button 
                          id="apply-coupon-btn" 
                          class="absolute right-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-md transition-colors"
                          data-i18n="cart.coupon_apply"
                        >
                          ${i18n.t('cart.coupon_apply')}
                        </button>
                      </div>
                    `}
                  </div>
                `}
              </div>
            </div>
          ` : ''}

          <!-- Pricing Calculations -->
          <div class="space-y-2 text-sm text-gray-600 dark:text-neutral-400">
            <div class="flex justify-between">
              <span data-i18n="cart.subtotal">${i18n.t('cart.subtotal')}</span>
              <span class="font-medium text-gray-900 dark:text-white">${i18n.formatCurrency(subtotal)}</span>
            </div>
            ${discount > 0 ? `
              <div class="flex justify-between text-green-600 dark:text-green-500 font-medium">
                <span data-i18n="cart.discount">${i18n.t('cart.discount')}</span>
                <span>-${i18n.formatCurrency(discount)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between">
              <span data-i18n="cart.tax">${i18n.t('cart.tax')}</span>
              <span class="font-medium text-gray-900 dark:text-white">${i18n.formatCurrency(tax)}</span>
            </div>
            
            <div class="pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800 flex justify-between items-baseline">
              <span class="font-bold text-gray-900 dark:text-white" data-i18n="cart.total">${i18n.t('cart.total')}</span>
              <span class="text-xl font-black text-orange-600 dark:text-orange-500">${i18n.formatCurrency(total)}</span>
            </div>
          </div>

          <!-- Checkout Button -->
          <button 
            id="checkout-btn"
            ${!hasItems ? 'disabled' : ''}
            class="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-credit-card"></i>
            <span data-i18n="cart.checkout">${i18n.t('cart.checkout')}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }
}
