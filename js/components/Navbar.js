import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class Navbar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    store.subscribe('currentCategory', () => this.render());
    store.subscribe('currentRoute', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    store.subscribe('cart', () => this.render());

    this.render();
  }

  bindEvents() {
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) {
      searchInput.value = store.state.searchQuery;
      searchInput.addEventListener('input', (e) => {
        store.setSearchQuery(e.target.value);
      });
    }

    const langSelect = this.container.querySelector('#lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
      });
    }

    const sidebarToggle = this.container.querySelector('#sidebar-toggle-btn');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) {
          sidebar.classList.remove('hidden');
          sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'w-64', 'lg:w-64');
          overlay?.classList.remove('hidden');
        }
      });
    }

    this.container.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.setCategory(btn.getAttribute('data-cat'));
      });
    });

    const holdBtn = this.container.querySelector('#header-hold-btn');
    if (holdBtn) {
      holdBtn.addEventListener('click', () => {
        if (store.state.cart.length > 0) {
          store.openModal('table');
        } else {
          store.showToast(i18n.t('tables.cart_empty_warn') || 'Cart is empty! Add products first.');
        }
      });
    }

    const tableBtn = this.container.querySelector('#header-table-btn');
    if (tableBtn) {
      tableBtn.addEventListener('click', () => {
        store.openModal('table');
      });
    }
  }

  render() {
    if (!this.container) return;

    const { currentCategory, currentRoute, activeLanguage, cart } = store.state;
    const hasCartItems = cart.length > 0;

    const categories = [
      { id: 'all', icon: 'fa-border-all', labelKey: 'categories.all' },
      { id: 'food', icon: 'fa-utensils', labelKey: 'categories.food' },
      { id: 'drinks', icon: 'fa-coffee', labelKey: 'categories.drinks' },
      { id: 'desserts', icon: 'fa-ice-cream', labelKey: 'categories.desserts' },
      { id: 'merch', icon: 'fa-tshirt', labelKey: 'categories.merch' }
    ];

    const routeLabels = {
      dashboard: 'Dashboard',
      pos: 'Point of Sale',
      transactions: 'Transactions',
      catalog: 'Catalog',
    };

    this.container.innerHTML = `
      <div class="h-full flex items-center justify-between gap-3 px-4">
        <div class="flex items-center gap-3">
          <button id="sidebar-toggle-btn" class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="hidden sm:block">
            <h2 class="text-sm font-bold text-gray-900 dark:text-white">${routeLabels[currentRoute] || 'Dashboard'}</h2>
          </div>
        </div>

        ${currentRoute === 'pos' ? `
          <div class="flex-1 max-w-md relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <i class="fa-solid fa-magnifying-glass text-sm"></i>
            </div>
            <input 
              type="text" 
              id="search-input"
              placeholder="${i18n.t('nav.search_placeholder')}" 
              class="w-full pl-10 pr-4 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-500 dark:placeholder-neutral-500"
            />
          </div>

          <div class="flex items-center gap-1.5">
            ${categories.map(cat => {
              const isActive = currentCategory === cat.id;
              return `
                <button 
                  data-cat="${cat.id}"
                  class="category-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }"
                >
                  <i class="fa-solid ${cat.icon} text-[10px]"></i>
                  <span class="hidden md:inline">${i18n.t(cat.labelKey)}</span>
                </button>
              `;
            }).join('')}
          </div>

          <div class="flex items-center gap-1">
            <button id="header-table-btn" class="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors" title="Table Map">
              <i class="fa-solid fa-table-cells-large text-[10px]"></i>
              <span class="hidden lg:inline">Table</span>
            </button>
            <button id="header-hold-btn" class="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${hasCartItems ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500'}" title="${i18n.t('cart.hold_bill')}">
              <i class="fa-solid fa-pause text-[10px]"></i>
              <span class="hidden lg:inline">${i18n.t('cart.hold_bill')}</span>
            </button>
          </div>
        ` : `
          <div class="flex-1 max-w-sm relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <i class="fa-solid fa-magnifying-glass text-sm"></i>
            </div>
            <input 
              type="text" 
              id="search-input"
              placeholder="${i18n.t('nav.search_placeholder')}" 
              class="w-full pl-10 pr-4 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-500 dark:placeholder-neutral-500"
            />
          </div>
        `}

        <div class="flex items-center gap-2">
          <div class="h-8 flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg px-2.5 transition-all cursor-pointer">
            <i class="fa-solid fa-globe text-gray-400 dark:text-neutral-500 mr-1 text-xs"></i>
            <select id="lang-select" class="bg-transparent border-none outline-none text-xs font-bold text-gray-600 dark:text-neutral-300 cursor-pointer pr-0.5 focus:ring-0">
              <option value="en" ${activeLanguage === 'en' ? 'selected' : ''}>EN</option>
              <option value="es" ${activeLanguage === 'es' ? 'selected' : ''}>ES</option>
              <option value="th" ${activeLanguage === 'th' ? 'selected' : ''}>TH</option>
            </select>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }
}
