// App Coordinator and Bootstrapper
import { store } from './store.js';
import { Navbar } from './components/Navbar.js';
import { ProductGrid } from './components/ProductGrid.js';
import { CartPanel } from './components/CartPanel.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { HistoryModal } from './components/HistoryModal.js';
import { CatalogModal } from './components/CatalogModal.js';
import { PendingOrdersModal } from './components/PendingOrdersModal.js';
import { TableModal } from './components/TableModal.js';
import { DashboardPage } from './components/DashboardPage.js';
import { TransactionsPage } from './components/TransactionsPage.js';
import { CatalogPage } from './components/CatalogPage.js';
import { initRouter } from './routes/router.js';

class App {
  constructor() {
    this.toastContainer = null;
  }

  async init() {
    // 1. Initialize store (loads i18n, db, themes)
    await store.init();

    // 2. Initialize lightweight hash route sync
    initRouter(store);

    // 3. Setup toast notification system
    this.initToastSystem();

    // 4. Initialize components
    new Navbar('navbar');
    new ProductGrid('product-grid');
    new CartPanel('cart-panel');
    new CheckoutModal('checkout-modal-container');
    new HistoryModal('history-modal-container');
    new CatalogModal('catalog-modal-container');
    new PendingOrdersModal('pending-orders-modal-container');
    new TableModal('table-modal-container');
    new DashboardPage('dashboard-page');
    new TransactionsPage('transactions-page');
    new CatalogPage('catalog-page');

    this.initRouteLayout();

    // 5. Setup mobile cart badge subscription
    store.subscribe('cart', (cart) => {
      const badge = document.getElementById('mobile-cart-badge');
      if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
        if (totalItems > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });

    console.log('BitDigo POS system successfully initialized.');
  }

  initRouteLayout() {
    const syncLayout = route => {
      const isPos = route === 'pos';
      const pageContent = document.getElementById('page-content');
      const productGrid = document.getElementById('product-grid');
      const cartPanel = document.getElementById('cart-panel');
      const mobileCartToggle = document.getElementById('mobile-cart-toggle');
      const mobileCartOverlay = document.getElementById('mobile-cart-overlay');

      pageContent?.classList.toggle('hidden', isPos);
      productGrid?.classList.toggle('hidden', !isPos);
      cartPanel?.classList.toggle('hidden', !isPos);
      mobileCartToggle?.classList.toggle('hidden', !isPos);

      if (!isPos) {
        mobileCartOverlay?.classList.add('hidden');
      }
    };

    syncLayout(store.state.currentRoute);
    store.subscribe('currentRoute', syncLayout);
  }

  initToastSystem() {
    // Create toast container if it doesn't exist
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full';
    document.body.appendChild(this.toastContainer);

    // Subscribe to toast changes in store
    store.subscribe('toast', (toast) => {
      if (toast) {
        this.spawnToast(toast.message);
      }
    });
  }

  spawnToast(message) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border border-white/10 dark:border-neutral-200 animate-toast-in';
    
    // Icon (default info bolt style)
    toast.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-md">
        <i class="fa-solid fa-bell"></i>
      </div>
      <div class="flex-1">${message}</div>
    `;

    this.toastContainer.appendChild(toast);

    // Self destroy after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3000);
  }
}

// Instantiate and launch the app when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(err => {
    console.error('Failed to bootstrap app:', err);
  });
});
