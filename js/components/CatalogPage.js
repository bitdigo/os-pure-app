import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class CatalogPage extends Component {
  constructor(containerIdOrElement) {
    super(containerIdOrElement);
    this.activeProductId = null;
    this.searchQuery = '';
    this.watch(['products', 'activeLanguage']);
    this.render();
  }

  get activeProduct() {
    return store.state.products.find(product => product.id === this.activeProductId) || null;
  }

  bindEvents() {
    this.on('input', '.catalog-search', event => {
      this.searchQuery = event.target.value;
      this.render();
    });

    this.on('click', '.edit-product-btn', (_event, button) => {
      this.activeProductId = button.getAttribute('data-id');
      this.render();
    });

    this.on('click', '.new-product-btn', () => {
      this.activeProductId = null;
      this.render();
    });

    this.on('click', '.delete-product-btn', async () => {
      if (!this.activeProduct) return;
      if (confirm(i18n.t('catalog.delete_confirm'))) {
        await store.deleteCatalogProduct(this.activeProduct.id);
        this.activeProductId = null;
        this.render();
      }
    });

    this.on('submit', '.catalog-page-form', async event => {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const existing = this.activeProduct;
      const product = {
        id: existing?.id || `p_${Date.now()}`,
        name: String(formData.get('name') || '').trim(),
        price: parseFloat(formData.get('price')),
        category: String(formData.get('category') || 'food'),
        image: String(formData.get('image') || '').trim()
      };

      if (!product.name || isNaN(product.price) || product.price < 0) {
        store.showToast(i18n.t('toast.invalid_amount'));
        return;
      }

      await store.saveCatalogProduct(product);
      this.activeProductId = product.id;
      this.render();
    });
  }

  render() {
    const query = this.searchQuery.trim().toLowerCase();
    const products = store.state.products.filter(product => {
      if (!query) return true;
      return product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
    });
    const activeProduct = this.activeProduct;

    this.setHtml(`
      <div class="p-4 sm:p-6 space-y-5 animate-page-enter">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">${escapeHtml(i18n.t('catalog.title'))}</h2>
            <p class="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Manage your product inventory</p>
          </div>
          <button class="new-product-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all active:scale-95">
            <i class="fa-solid fa-plus"></i>
            ${escapeHtml(i18n.t('catalog.add_item'))}
          </button>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-gray-100 dark:border-neutral-800">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <i class="fa-solid fa-magnifying-glass text-sm"></i>
                </div>
                <input
                  class="catalog-search w-full sm:max-w-md pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="Search products"
                  value="${escapeHtml(this.searchQuery)}"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 p-4">
              ${products.length === 0 ? `
                <div class="md:col-span-2 2xl:col-span-3 py-12 text-center text-gray-500 dark:text-neutral-400">
                  <i class="fa-solid fa-box-open text-3xl mb-3 block opacity-30"></i>
                  No catalog items found.
                </div>
              ` : products.map(product => `
                <button data-id="${escapeHtml(product.id)}" class="edit-product-btn text-left p-4 rounded-2xl border transition-all duration-200 ${product.id === this.activeProductId ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 dark:border-neutral-800 hover:border-orange-500/40'}">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0">
                      ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover">` : '<i class="fa-solid fa-box"></i>'}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-gray-950 dark:text-white truncate">${escapeHtml(product.name)}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${product.category === 'food' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : product.category === 'drinks' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : product.category === 'desserts' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'}">${escapeHtml(product.category)}</span>
                        <span class="text-xs font-bold text-orange-500">${escapeHtml(i18n.formatCurrency(product.price))}</span>
                      </div>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>
          </section>

          <aside class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 h-fit sticky top-0">
            <h3 class="font-black text-gray-950 dark:text-white">${activeProduct ? escapeHtml(i18n.t('catalog.edit_item')) : escapeHtml(i18n.t('catalog.add_item'))}</h3>
            <form class="catalog-page-form mt-5 space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_name'))}</label>
                <input name="name" required value="${escapeHtml(activeProduct?.name || '')}" class="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_price'))}</label>
                  <input name="price" type="number" step="0.01" min="0" required value="${escapeHtml(activeProduct?.price ?? '')}" class="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_category'))}</label>
                  <select name="category" class="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                    ${['drinks', 'food', 'desserts', 'merch', 'custom'].map(category => `
                      <option value="${category}" ${activeProduct?.category === category ? 'selected' : ''}>${category}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_image'))}</label>
                <input name="image" type="url" value="${escapeHtml(activeProduct?.image || '')}" class="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
              </div>
              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all active:scale-95">${escapeHtml(i18n.t('catalog.form_save'))}</button>
                ${activeProduct ? `
                  <button type="button" class="delete-product-btn px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-500/10 text-sm font-bold transition-all active:scale-95">${escapeHtml(i18n.t('catalog.form_delete'))}</button>
                ` : ''}
              </div>
            </form>
          </aside>
        </div>
      </div>
    `);

    this.bindEvents();
  }
}
