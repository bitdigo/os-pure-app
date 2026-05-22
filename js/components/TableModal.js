// Table Map Selection Modal
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class TableModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.modalEl = null;
    this.selectedTableId = null;

    // Listen to changes in pendingOrders or language
    store.subscribe('pendingOrders', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    
    // Subscribe to active modal state changes
    store.subscribe('activeModal', (modal) => {
      if (modal === 'table') {
        this.open();
      } else {
        this.close();
      }
    });

    this.initHtml();
  }

  initHtml() {
    this.container.innerHTML = `
      <div id="table-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md opacity-0 transition-opacity duration-300">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transform scale-95 opacity-0 transition-all duration-300 flex flex-col max-h-[85vh]">
          
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-table-cells-large"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-100" data-i18n="tables.title">Table Layout & Management</h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400" data-i18n="tables.tagline">Select a table to assign, resume, or manage bills</p>
              </div>
            </div>
            <button id="close-table-modal" class="w-10 h-10 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Table Grid Content -->
          <div class="p-6 overflow-y-auto flex-1 bg-neutral-50/50 dark:bg-neutral-900/20">
            <div id="table-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Rendered Dynamically -->
            </div>
          </div>

          <!-- Info Footer -->
          <div class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center text-xs text-neutral-500">
            <div class="flex gap-4">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Vacant</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Occupied</span>
            </div>
            <div class="text-neutral-400 dark:text-neutral-500">Click occupied table for quick actions</div>
          </div>

        </div>
      </div>
    `;

    this.modalEl = document.getElementById('table-modal');

    // Bind Close events
    document.getElementById('close-table-modal').addEventListener('click', () => {
      store.closeModal();
    });

    // Close on backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        store.closeModal();
      }
    });

    this.render();
  }

  open() {
    this.modalEl.classList.remove('hidden');
    // Trigger transition
    setTimeout(() => {
      this.modalEl.classList.remove('opacity-0');
      this.modalEl.querySelector('div').classList.remove('scale-95', 'opacity-0');
    }, 10);
  }

  close() {
    if (!this.modalEl || this.modalEl.classList.contains('hidden')) return;
    this.modalEl.classList.add('opacity-0');
    this.modalEl.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      this.modalEl.classList.add('hidden');
    }, 300);
  }

  getOccupancyTime(isoString) {
    const elapsed = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (elapsed < 60) return `Just now`;
    const mins = Math.floor(elapsed / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  }

  async handleTableAction(tableId, action) {
    const orderId = `TABLE-${tableId}`;
    const pendingOrder = store.state.pendingOrders.find(o => o.id === orderId);

    if (action === 'hold') {
      if (store.state.cart.length === 0) {
        store.showToast(i18n.t('tables.cart_empty_warn') || 'Cart is empty! Add products first.');
        return;
      }
      await store.holdCurrentOrder(`Table ${tableId.replace('T', '')}`, tableId);
      store.closeModal();
    } 
    else if (action === 'resume') {
      if (store.state.cart.length > 0) {
        const confirmOverwrite = confirm(i18n.t('cart.overwrite_confirm') || 'Resuming will overwrite current cart. Proceed?');
        if (!confirmOverwrite) return;
      }
      await store.resumePendingOrder(orderId);
      store.closeModal();
    }
    else if (action === 'merge') {
      if (store.state.cart.length === 0) {
        store.showToast(i18n.t('tables.cart_empty_warn') || 'Cart is empty! Add products first.');
        return;
      }
      await store.mergeCartIntoTable(tableId);
      store.closeModal();
    }
    else if (action === 'pay') {
      // Direct checkout: resume first
      await store.resumePendingOrder(orderId);
      // Wait slightly and open checkout modal
      store.openModal('checkout');
    }
    else if (action === 'clear') {
      const confirmDelete = confirm(i18n.t('toast.order_delete_confirm') || 'Are you sure you want to delete this order?');
      if (confirmDelete) {
        await store.deletePendingOrder(orderId);
      }
    }
  }

  render() {
    if (!this.modalEl) return;

    // Handle standard translation strings
    this.modalEl.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = i18n.t(key);
    });

    const grid = document.getElementById('table-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Render 12 tables: T1 to T12
    for (let i = 1; i <= 12; i++) {
      const tableId = `T${i}`;
      const orderId = `TABLE-${tableId}`;
      const heldOrder = store.state.pendingOrders.find(o => o.id === orderId);

      const tableCard = document.createElement('div');
      
      if (heldOrder) {
        // Occupied style
        const totalItemsCount = heldOrder.cart.reduce((sum, item) => sum + item.quantity, 0);
        const durationText = this.getOccupancyTime(heldOrder.timestamp);
        
        tableCard.className = 'relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-neutral-800 border-2 border-amber-500/80 dark:border-amber-500/60 shadow-lg shadow-amber-500/5 dark:shadow-none hover:shadow-xl transition-all duration-200 group overflow-hidden h-44';
        tableCard.innerHTML = `
          <div>
            <div class="flex justify-between items-start">
              <span class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Table ${i}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-wide animate-pulse">Occupied</span>
            </div>
            <div class="mt-3">
              <p class="text-lg font-black text-neutral-900 dark:text-white">${i18n.formatCurrency(heldOrder.total)}</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">${totalItemsCount} items • ${durationText}</p>
            </div>
          </div>

          <!-- Action Hover Overlay -->
          <div class="absolute inset-0 bg-neutral-900/90 dark:bg-neutral-950/95 flex flex-col justify-center p-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div class="grid grid-cols-2 gap-1.5">
              <button data-action="resume" class="py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition">Resume</button>
              <button data-action="merge" class="py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition">Add/Merge</button>
            </div>
            <button data-action="pay" class="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">Pay Now</button>
            <button data-action="clear" class="w-full py-1 rounded-xl bg-neutral-700 hover:bg-red-600 text-neutral-300 hover:text-white text-[11px] font-medium transition">Clear Table</button>
          </div>
        `;
      } else {
        // Vacant style
        const hasCartItems = store.state.cart.length > 0;
        tableCard.className = `flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] dark:hover:bg-emerald-500/[0.01] transition-all duration-200 cursor-pointer h-44 ${hasCartItems ? 'hover:scale-[1.02]' : 'opacity-70'}`;
        tableCard.innerHTML = `
          <div>
            <div class="flex justify-between items-start">
              <span class="text-sm font-bold text-neutral-800 dark:text-neutral-300">Table ${i}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wide">Vacant</span>
            </div>
            <div class="mt-4 flex flex-col justify-center items-center h-20 text-neutral-400 dark:text-neutral-500">
              <i class="fa-solid fa-chair text-2xl mb-1"></i>
              <span class="text-[10px] font-medium uppercase tracking-wide">Available</span>
            </div>
          </div>
          ${hasCartItems ? `
            <button data-action="hold" class="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-anchor text-[10px]"></i> Hold Cart
            </button>
          ` : `
            <div class="text-[10px] text-center text-neutral-400 py-1">Ready for orders</div>
          `}
        `;
      }

      // Add click handlers for the hover overlay and cards
      tableCard.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          this.handleTableAction(tableId, action);
        });
      });

      // Clicking card itself triggers hold (if vacant) or acts as resume (if occupied)
      if (!heldOrder) {
        tableCard.addEventListener('click', () => {
          if (store.state.cart.length > 0) {
            this.handleTableAction(tableId, 'hold');
          }
        });
      }

      grid.appendChild(tableCard);
    }
  }
}
