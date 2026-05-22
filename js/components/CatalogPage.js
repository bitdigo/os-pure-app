import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class CatalogPage extends Component {
  constructor(containerId) {
    super(containerId);
    this.activeProductId = null;
    this.searchQuery = '';
    this.watch(['currentRoute', 'products', 'activeLanguage']);
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
    if (store.state.currentRoute !== 'catalog') {
      this.setHtml('');
      return;
    }

    const query = this.searchQuery.trim().toLowerCase();
    const products = store.state.products.filter(product => {
      if (!query) return true;
      return product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
    });
    const activeProduct = this.activeProduct;

    this.setHtml(`
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">Inventory</p>
            <h2 class="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">${escapeHtml(i18n.t('catalog.title'))}</h2>
          </div>
          <button class="new-product-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition">
            <i class="fa-solid fa-plus"></i>
            ${escapeHtml(i18n.t('catalog.add_item'))}
          </button>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          <section class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-gray-100 dark:border-neutral-800">
              <input
                class="catalog-search w-full sm:max-w-md px-4 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Search products"
                value="${escapeHtml(this.searchQuery)}"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 p-4">
              ${products.length === 0 ? `
                <div class="md:col-span-2 2xl:col-span-3 py-12 text-center text-gray-500 dark:text-neutral-400">No catalog items found.</div>
              ` : products.map(product => `
                <button data-id="${escapeHtml(product.id)}" class="edit-product-btn text-left p-4 rounded-2xl border transition ${product.id === this.activeProductId ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-gray-100 dark:border-neutral-800 hover:border-orange-500/40'}">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-gray-400">
                      ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover">` : '<i class="fa-solid fa-box"></i>'}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-gray-950 dark:text-white truncate">${escapeHtml(product.name)}</p>
                      <p class="text-xs text-gray-500 dark:text-neutral-400">${escapeHtml(product.category)} · ${escapeHtml(i18n.formatCurrency(product.price))}</p>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>
          </section>

          <aside class="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 h-fit">
            <h3 class="font-black text-gray-950 dark:text-white">${activeProduct ? escapeHtml(i18n.t('catalog.edit_item')) : escapeHtml(i18n.t('catalog.add_item'))}</h3>
            <form class="catalog-page-form mt-5 space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_name'))}</label>
                <input name="name" required value="${escapeHtml(activeProduct?.name || '')}" class="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_price'))}</label>
                  <input name="price" type="number" step="0.01" min="0" required value="${escapeHtml(activeProduct?.price ?? '')}" class="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_category'))}</label>
                  <select name="category" class="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
                    ${['drinks', 'food', 'desserts', 'merch', 'custom'].map(category => `
                      <option value="${category}" ${activeProduct?.category === category ? 'selected' : ''}>${category}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-1">${escapeHtml(i18n.t('catalog.form_image'))}</label>
                <input name="image" type="url" value="${escapeHtml(activeProduct?.image || '')}" class="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
              </div>
              <div class="flex gap-2">
                <button class="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition">${escapeHtml(i18n.t('catalog.form_save'))}</button>
                ${activeProduct ? `
                  <button type="button" class="delete-product-btn px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-500/10 text-sm font-bold transition">${escapeHtml(i18n.t('catalog.form_delete'))}</button>
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
