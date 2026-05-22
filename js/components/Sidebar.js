import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    store.subscribe('currentRoute', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    store.subscribe('theme', () => this.render());
    store.subscribe('pendingOrders', () => this.render());
    store.subscribe('transactions', () => this.render());

    this.render();
  }

  bindEvents() {
    this.container.querySelectorAll('.sidebar-route-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.setRoute(btn.getAttribute('data-route'));
        this.closeMobileSidebar();
      });
    });

    const themeBtn = this.container.querySelector('#sidebar-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = store.state.theme === 'dark' ? 'light' : 'dark';
        store.setTheme(nextTheme);
      });
    }

    const pendingBtn = this.container.querySelector('#sidebar-pending-toggle');
    if (pendingBtn) {
      pendingBtn.addEventListener('click', () => {
        store.openModal('pending_orders');
      });
    }
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'w-64', 'lg:w-64');
      overlay?.classList.add('hidden');
    }
  }

  render() {
    if (!this.container) return;

    const { currentRoute, theme, pendingOrders, transactions } = store.state;
    const pendingCount = pendingOrders ? pendingOrders.length : 0;
    const orderCount = transactions.filter(t => !t.refunded).length;

    const navItems = [
      { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
      { id: 'pos', icon: 'fa-cash-register', label: 'POS' },
      { id: 'transactions', icon: 'fa-receipt', label: 'Transactions', badge: orderCount },
      { id: 'catalog', icon: 'fa-store', label: 'Catalog' },
    ];

    this.container.innerHTML = `
      <div class="flex flex-col h-full py-4">
        <div class="flex flex-col items-center px-2 mb-6">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
            <i class="fa-solid fa-bolt text-white text-lg"></i>
          </div>
        </div>

        <nav class="flex-1 px-2 space-y-1">
          ${navItems.map(item => {
            const isActive = currentRoute === item.id;
            return `
              <button
                data-route="${item.id}"
                class="sidebar-route-btn w-full flex items-center justify-center rounded-xl py-2.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-500 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-200'
                }"
                title="${item.label}"
              >
                <div class="relative">
                  <i class="fa-solid ${item.icon} text-lg"></i>
                  ${item.badge && item.badge > 0 ? `
                    <span class="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full ${isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'} text-[9px] font-bold flex items-center justify-center">
                      ${item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ` : ''}
                </div>
              </button>
            `;
          }).join('')}
        </nav>

        <div class="px-2 space-y-1 border-t border-gray-100 dark:border-neutral-800 pt-3 mt-3">
          <button
            id="sidebar-pending-toggle"
            class="w-full flex items-center justify-center rounded-xl py-2.5 text-gray-500 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-200 transition-all duration-150"
            title="Pending Orders"
          >
            <div class="relative">
              <i class="fa-solid fa-pause text-lg"></i>
              ${pendingCount > 0 ? `
                <span class="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  ${pendingCount}
                </span>
              ` : ''}
            </div>
          </button>
        </div>

        <div class="px-2 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <button
            id="sidebar-theme-toggle"
            class="w-full flex items-center justify-center rounded-xl py-2.5 text-gray-500 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-200 transition-all duration-150"
            title="${theme === 'dark' ? 'Light mode' : 'Dark mode'}"
          >
            <i class="fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg"></i>
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }
}
