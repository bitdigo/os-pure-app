// Navbar and Category Navigation Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class Navbar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('currentCategory', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    store.subscribe('theme', () => this.render());
    store.subscribe('transactions', () => this.render());
    store.subscribe('pendingOrders', () => this.render());

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    // 1. Search Query Input
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) {
      // Retain the query value across re-renders
      searchInput.value = store.state.searchQuery;
      
      searchInput.addEventListener('input', (e) => {
        store.setSearchQuery(e.target.value);
      });
    }

    // 2. Category Buttons
    this.container.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        if (cat === 'catalog') {
          store.setRoute('catalog');
        } else {
          store.setRoute('pos');
          store.setCategory(cat);
        }
      });
    });

    // 3. Language Selector
    const langSelect = this.container.querySelector('#lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
      });
    }

    // 4. Theme Toggle Button
    const themeBtn = this.container.querySelector('#theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = store.state.theme === 'dark' ? 'light' : 'dark';
        store.setTheme(nextTheme);
      });
    }

    // 5. History Button
    const historyBtn = this.container.querySelector('#history-toggle');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        store.setRoute('history');
      });
    }

    // 6. Pending Orders Button
    const pendingBtn = this.container.querySelector('#pending-orders-toggle');
    if (pendingBtn) {
      pendingBtn.addEventListener('click', () => {
        store.openModal('pending_orders');
      });
    }

    // 7. Table Map Toggle Button
    const tableMapBtn = this.container.querySelector('#table-map-toggle');
    if (tableMapBtn) {
      tableMapBtn.addEventListener('click', () => {
        store.openModal('table');
      });
    }
  }

  render() {
    if (!this.container) return;

    const { currentCategory, activeLanguage, theme, transactions, pendingOrders } = store.state;
    
    const categories = [
      { id: 'all', icon: 'fa-border-all', labelKey: 'categories.all' },
      { id: 'food', icon: 'fa-utensils', labelKey: 'categories.food' },
      { id: 'drinks', icon: 'fa-coffee', labelKey: 'categories.drinks' },
      { id: 'desserts', icon: 'fa-ice-cream', labelKey: 'categories.desserts' },
      { id: 'merch', icon: 'fa-tshirt', labelKey: 'categories.merch' },
      { id: 'catalog', icon: 'fa-store', labelKey: 'categories.catalog', highlight: true }
    ];

    const orderCount = transactions.filter(t => !t.refunded).length;
    const pendingCount = pendingOrders ? pendingOrders.length : 0;

    this.container.innerHTML = `
      <header class="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <i class="fa-solid fa-bolt text-white text-lg"></i>
            </div>
            <div class="hidden sm:block">
              <h1 class="font-bold text-lg leading-none text-gray-900 dark:text-white" data-i18n="app.title">${i18n.t('app.title')}</h1>
              <span class="text-xs text-gray-500 dark:text-neutral-400" data-i18n="app.tagline">${i18n.t('app.tagline')}</span>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="flex-1 max-w-md relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <input 
              type="text" 
              id="search-input"
              data-i18n-attr="placeholder:nav.search_placeholder"
              placeholder="${i18n.t('nav.search_placeholder')}" 
              class="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white transition-colors duration-200 placeholder-gray-500 dark:placeholder-neutral-500"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Theme Toggle -->
            <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-all active:scale-95" title="${i18n.t(theme === 'dark' ? 'nav.theme_light' : 'nav.theme_dark')}">
              <i class="fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
            </button>

            <!-- Language Select -->
            <div class="h-10 flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl px-3 transition-all cursor-pointer">
              <i class="fa-solid fa-globe text-gray-500 dark:text-neutral-400 mr-1.5 text-sm"></i>
              <select id="lang-select" class="bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-neutral-200 cursor-pointer pr-1 focus:ring-0">
                <option value="en" ${activeLanguage === 'en' ? 'selected' : ''}>EN</option>
                <option value="es" ${activeLanguage === 'es' ? 'selected' : ''}>ES</option>
                <option value="th" ${activeLanguage === 'th' ? 'selected' : ''}>TH</option>
              </select>
            </div>

            <!-- Table Map Grid Toggle -->
            <button id="table-map-toggle" class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-all active:scale-95" title="Table Map">
              <i class="fa-solid fa-table-cells-large"></i>
            </button>

            <!-- Pending Orders / Hold Bills Toggle -->
            <button id="pending-orders-toggle" class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-all active:scale-95" title="${i18n.t('nav.pending_orders')}">
              <i class="fa-solid fa-pause"></i>
              ${pendingCount > 0 ? `
                <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  ${pendingCount}
                </span>
              ` : ''}
            </button>

            <!-- Transaction History Toggle -->
            <button id="history-toggle" class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-all active:scale-95" title="${i18n.t('nav.history')}">
              <i class="fa-solid fa-clock-rotate-left"></i>
              ${orderCount > 0 ? `
                <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  ${orderCount}
                </span>
              ` : ''}
            </button>
          </div>
        </div>
      </header>

      <!-- Category Filter Slider -->
      <nav class="bg-gray-50 dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-900 py-3 transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="category-slider flex gap-2 overflow-x-auto pb-1 -mb-1">
            ${categories.map(cat => {
              const isActive = currentCategory === cat.id;
              
              if (cat.highlight) {
                return `
                  <button 
                    data-cat="${cat.id}"
                    class="category-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-orange-500/40 text-orange-500 hover:border-orange-500 hover:bg-orange-500/5 transition-all"
                  >
                    <i class="fa-solid ${cat.icon}"></i>
                    <span data-i18n="${cat.labelKey}">${i18n.t(cat.labelKey)}</span>
                  </button>
                `;
              }

              return `
                <button 
                  data-cat="${cat.id}"
                  class="category-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }"
                >
                  <i class="fa-solid ${cat.icon}"></i>
                  <span data-i18n="${cat.labelKey}">${i18n.t(cat.labelKey)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </nav>
    `;

    this.bindEvents();
  }
}
