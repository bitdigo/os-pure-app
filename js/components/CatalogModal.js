// Catalog CRUD Management Modal
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class CatalogModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.modalEl = null;
    this.activeProduct = null; // null means adding new item
    this.searchQuery = '';

    store.subscribe('products', () => this.render());
    store.subscribe('activeLanguage', () => this.render());
    
    store.subscribe('activeModal', (modal) => {
      if (modal === 'catalog') {
        this.open();
      } else {
        this.close();
      }
    });

    this.initHtml();
  }

  initHtml() {
    this.container.innerHTML = `
      <div id="catalog-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md opacity-0 transition-opacity duration-300">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transform scale-95 opacity-0 transition-all duration-300 flex flex-col max-h-[85vh]">
          
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-store"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-100" data-i18n="catalog.title">Menu Catalog Management</h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400" data-i18n="catalog.tagline">Add, edit, or delete items from the active POS menu</p>
              </div>
            </div>
            <button id="close-catalog-modal" class="w-10 h-10 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Main Layout Grid -->
          <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            <!-- Left Side: Product List & Search -->
            <div class="flex-1 flex flex-col border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
              <!-- Search Bar -->
              <div class="p-4 border-b border-neutral-100 dark:border-neutral-800 flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                    <i class="fa-solid fa-magnifying-glass text-xs"></i>
                  </span>
                  <input type="text" id="catalog-search" class="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 dark:text-white" placeholder="Search products...">
                </div>
                <button id="catalog-new-btn" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0">
                  <i class="fa-solid fa-plus"></i> <span data-i18n="catalog.add_item">New Item</span>
                </button>
              </div>

              <!-- Product List Grid -->
              <div id="catalog-items-list" class="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] md:max-h-none">
                <!-- Rendered Dynamically -->
              </div>
            </div>

            <!-- Right Side: Item Editor Form -->
            <div class="w-full md:w-[360px] p-6 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto flex flex-col justify-between">
              <div>
                <h4 id="editor-title" class="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">Add New Product</h4>
                
                <form id="catalog-form" class="flex flex-col gap-4 text-xs">
                  <input type="hidden" id="item-id">
                  
                  <div>
                    <label class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5" data-i18n="catalog.form_name">PRODUCT NAME</label>
                    <input type="text" id="item-name" required class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 dark:text-white font-medium">
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5" data-i18n="catalog.form_price">PRICE</label>
                      <input type="number" id="item-price" step="0.01" required min="0" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 dark:text-white font-medium">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5" data-i18n="catalog.form_category">CATEGORY</label>
                      <select id="item-category" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 dark:text-white font-semibold">
                        <option value="drinks">drinks</option>
                        <option value="food">food</option>
                        <option value="desserts">desserts</option>
                        <option value="merch">merch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5" data-i18n="catalog.form_image">IMAGE URL (OPTIONAL)</label>
                    <input type="url" id="item-image" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 dark:text-white font-medium" placeholder="https://unsplash.com/...">
                  </div>

                  <div class="mt-4 flex flex-col gap-2">
                    <button type="submit" id="submit-item-btn" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5">
                      <i class="fa-solid fa-save"></i> <span data-i18n="catalog.form_save">Save Product</span>
                    </button>
                    <button type="button" id="delete-item-btn" class="w-full py-2.5 bg-red-50/50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 hidden border border-red-200 dark:border-red-900/50">
                      <i class="fa-solid fa-trash"></i> <span data-i18n="catalog.form_delete">Delete Product</span>
                    </button>
                  </div>
                </form>
              </div>

              <div class="text-[10px] text-center text-neutral-400 mt-6 md:mt-0 font-medium">
                Default items can be modified or deleted. Saving auto-updates the main display.
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    this.modalEl = document.getElementById('catalog-modal');

    // Bind Close events
    document.getElementById('close-catalog-modal').addEventListener('click', () => {
      store.closeModal();
    });

    // Close on backdrop
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        store.closeModal();
      }
    });

    // Bind search field
    const searchField = document.getElementById('catalog-search');
    searchField.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderList();
    });

    // Form submission
    const form = document.getElementById('catalog-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProductFromForm();
    });

    // Delete item click
    const deleteBtn = document.getElementById('delete-item-btn');
    deleteBtn.addEventListener('click', async () => {
      await this.deleteProduct();
    });

    // New item click
    const newBtn = document.getElementById('catalog-new-btn');
    newBtn.addEventListener('click', () => {
      this.setFormProduct(null);
    });

    this.render();
  }

  open() {
    this.modalEl.classList.remove('hidden');
    setTimeout(() => {
      this.modalEl.classList.remove('opacity-0');
      this.modalEl.querySelector('div').classList.remove('scale-95', 'opacity-0');
    }, 10);
    this.setFormProduct(null);
  }

  close() {
    if (!this.modalEl || this.modalEl.classList.contains('hidden')) return;
    this.modalEl.classList.add('opacity-0');
    this.modalEl.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      this.modalEl.classList.add('hidden');
    }, 300);
  }

  setFormProduct(product) {
    this.activeProduct = product;
    const titleEl = document.getElementById('editor-title');
    const deleteBtn = document.getElementById('delete-item-btn');
    
    const idField = document.getElementById('item-id');
    const nameField = document.getElementById('item-name');
    const priceField = document.getElementById('item-price');
    const categoryField = document.getElementById('item-category');
    const imageField = document.getElementById('item-image');

    if (product) {
      titleEl.textContent = `Edit Product: ${product.name}`;
      deleteBtn.classList.remove('hidden');
      
      idField.value = product.id;
      nameField.value = product.name;
      priceField.value = product.price;
      categoryField.value = product.category;
      imageField.value = product.image || '';
    } else {
      titleEl.textContent = `Add New Product`;
      deleteBtn.classList.add('hidden');
      
      idField.value = '';
      nameField.value = '';
      priceField.value = '';
      categoryField.value = 'drinks';
      imageField.value = '';
    }
  }

  async saveProductFromForm() {
    const idField = document.getElementById('item-id');
    const nameField = document.getElementById('item-name');
    const priceField = document.getElementById('item-price');
    const categoryField = document.getElementById('item-category');
    const imageField = document.getElementById('item-image');

    const id = idField.value || `prod-${Date.now()}`;
    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
    
    const product = {
      id: id,
      name: nameField.value.trim(),
      price: parseFloat(priceField.value),
      category: categoryField.value,
      image: imageField.value.trim() || defaultImage
    };

    const success = await store.saveCatalogProduct(product);
    if (success) {
      this.setFormProduct(null);
    }
  }

  async deleteProduct() {
    if (!this.activeProduct) return;
    const confirmDelete = confirm(`${i18n.t('catalog.delete_confirm') || 'Are you sure you want to delete this product from the menu?'} (${this.activeProduct.name})`);
    if (confirmDelete) {
      const success = await store.deleteCatalogProduct(this.activeProduct.id);
      if (success) {
        this.setFormProduct(null);
      }
    }
  }

  renderList() {
    const listContainer = document.getElementById('catalog-items-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const filtered = store.state.products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(this.searchQuery) || p.category.toLowerCase().includes(this.searchQuery);
      return matchesSearch;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-10 text-neutral-400">
          <i class="fa-solid fa-box-open text-3xl mb-2"></i>
          <span class="text-xs">No products found</span>
        </div>
      `;
      return;
    }

    filtered.forEach(p => {
      const itemCard = document.createElement('div');
      itemCard.className = `p-3 rounded-2xl flex items-center justify-between border cursor-pointer transition-all ${this.activeProduct?.id === p.id ? 'bg-amber-500/10 border-amber-500 dark:border-amber-500/60' : 'bg-white dark:bg-neutral-800/60 border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700'}`;
      
      itemCard.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <img src="${p.image}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'">
          <div class="min-w-0">
            <p class="font-bold text-neutral-800 dark:text-neutral-200 truncate text-xs">${p.name}</p>
            <p class="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">${p.category}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-black text-neutral-900 dark:text-white text-xs">${i18n.formatCurrency(p.price)}</span>
          <div class="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-amber-500">
            <i class="fa-solid fa-pen text-[10px]"></i>
          </div>
        </div>
      `;

      itemCard.addEventListener('click', () => {
        this.setFormProduct(p);
        this.renderList(); // highlight active selection
      });

      listContainer.appendChild(itemCard);
    });
  }

  render() {
    if (!this.modalEl) return;

    // Translation keys
    this.modalEl.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = i18n.t(key);
    });

    this.renderList();
  }
}
