// Pending Held Orders / Parked Bills Modal Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class PendingOrdersModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('activeModal', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    store.subscribe('pendingOrders', () => this.render());

    // Local component state
    this.selectedOrderId = null;

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    if (store.state.activeModal !== 'pending_orders') return;

    // Close buttons
    this.container.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        store.closeModal();
      });
    });

    // Row selection toggles
    this.container.querySelectorAll('.order-row').forEach(row => {
      row.addEventListener('click', () => {
        const orderId = row.getAttribute('data-id');
        this.selectedOrderId = this.selectedOrderId === orderId ? null : orderId;
        this.render();
      });
    });

    // Resume / Restore order button
    this.container.querySelectorAll('.resume-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Avoid triggering row toggling
        const orderId = btn.getAttribute('data-id');
        
        // Confirmation if active cart already contains items
        if (store.state.cart.length > 0) {
          if (!confirm(i18n.t('cart.overwrite_confirm'))) {
            return;
          }
        }

        const success = await store.resumePendingOrder(orderId);
        if (success) {
          store.closeModal();
        }
      });
    });

    // Delete held order button
    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Avoid triggering row toggling
        const orderId = btn.getAttribute('data-id');
        if (confirm(i18n.t('toast.order_delete_confirm') || 'Are you sure you want to delete this held order?')) {
          await store.deletePendingOrder(orderId);
          if (this.selectedOrderId === orderId) {
            this.selectedOrderId = null;
          }
        }
      });
    });
  }

  // Row template renderer helper
  getOrderRowTemplate(order) {
    const isSelected = this.selectedOrderId === order.id;
    const formattedTotal = i18n.formatCurrency(order.total);
    const formattedDate = i18n.formatDate(order.timestamp);
    const itemCount = order.cart.reduce((sum, item) => sum + item.quantity, 0);

    let itemsDetailsHtml = '';
    if (isSelected) {
      const itemsListHtml = order.cart.map(item => `
        <div class="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-neutral-800 last:border-0">
          <span class="text-gray-700 dark:text-neutral-300 font-medium">${item.product.name} <span class="text-gray-400 font-bold">x${item.quantity}</span></span>
          <span class="font-semibold text-gray-900 dark:text-white">${i18n.formatCurrency(item.product.price * item.quantity)}</span>
        </div>
      `).join('');

      itemsDetailsHtml = `
        <div class="px-4 pb-4 pt-2 bg-gray-50/50 dark:bg-neutral-950/20 border-t border-gray-100 dark:border-neutral-900 space-y-3">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bill Details</span>
            ${itemsListHtml}
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800">
            <div>
              <span class="text-gray-400">Subtotal:</span>
              <span class="font-medium text-gray-800 dark:text-neutral-200 ml-1">${i18n.formatCurrency(order.subtotal)}</span>
            </div>
            ${order.discountValue > 0 ? `
              <div>
                <span class="text-gray-400">Discount:</span>
                <span class="font-medium text-green-500 ml-1">
                  -${order.discountType === 'percent' ? order.discountValue + '%' : i18n.formatCurrency(order.discountValue)}
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-900">
            <!-- Delete -->
            <button 
              data-id="${order.id}"
              class="delete-btn py-1.5 px-3 rounded-lg border border-red-500/20 hover:bg-red-500/5 text-red-500 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <i class="fa-solid fa-trash-can text-[10px]"></i>
              <span data-i18n="history.refund">Delete</span>
            </button>
            <!-- Resume -->
            <button 
              data-id="${order.id}"
              class="resume-btn py-1.5 px-4.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <i class="fa-solid fa-folder-open text-[10px]"></i>
              <span data-i18n="cart.checkout">Resume Order</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-500/20 dark:hover:border-orange-500/10 transition-colors">
        <!-- Order Header Summary -->
        <div 
          data-id="${order.id}"
          class="order-row p-4 flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-950/40 cursor-pointer select-none transition-colors"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm text-gray-900 dark:text-white truncate">${order.reference}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-wide">${itemCount} items</span>
            </div>
            <span class="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 block">${formattedDate}</span>
          </div>

          <div class="text-right flex items-center gap-3">
            <div>
              <span class="font-black text-gray-950 dark:text-white text-base">${formattedTotal}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-xs text-gray-400 transition-transform ${isSelected ? 'rotate-180' : ''}"></i>
          </div>
        </div>

        <!-- Expanded Details -->
        ${itemsDetailsHtml}
      </div>
    `;
  }

  render() {
    if (store.state.activeModal !== 'pending_orders') {
      this.container.innerHTML = '';
      return;
    }

    const { pendingOrders } = store.state;

    this.container.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-fade-in">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 animate-scale-up relative p-6 max-h-[90vh] flex flex-col">
          
          <!-- Top Close X Button -->
          <button class="close-modal absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>

          <!-- Modal Title -->
          <h3 class="text-xl font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <i class="fa-solid fa-pause text-amber-500"></i>
            <span data-i18n="nav.pending_orders">${i18n.t('nav.pending_orders') || 'Pending Orders'}</span>
          </h3>

          <!-- List Scrollport -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            ${!pendingOrders || pendingOrders.length === 0 ? `
              <div class="py-16 text-center text-gray-400 dark:text-neutral-500">
                <div class="w-16 h-16 rounded-full bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <i class="fa-solid fa-box-archive text-2xl"></i>
                </div>
                <p class="text-sm font-semibold" data-i18n="history.no_pending">No pending bills found</p>
              </div>
            ` : pendingOrders.map(order => this.getOrderRowTemplate(order)).join('')}
          </div>

          <!-- Close Footer Panel -->
          <div class="mt-4 border-t border-gray-100 dark:border-neutral-800 pt-4">
            <button 
              class="close-modal w-full py-3 rounded-2xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-bold transition-all text-sm flex items-center justify-center gap-2"
            >
              <span data-i18n="history.close">${i18n.t('history.close')}</span>
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }
}
export default PendingOrdersModal;
