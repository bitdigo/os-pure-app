// Custom Product Modal Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';

export class CustomProductModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Subscribe to state changes to trigger re-renders
    store.subscribe('activeModal', () => this.render());
    store.subscribe('activeLanguage', () => this.render());

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    if (store.state.activeModal !== 'custom_product') return;

    // Close button
    const closeBtn = this.container.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        store.closeModal();
      });
    }

    // Form Submit
    const form = this.container.querySelector('#custom-product-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = form.querySelector('#custom-name');
        const priceInput = form.querySelector('#custom-price');
        const catSelect = form.querySelector('#custom-cat');
        
        if (nameInput && priceInput && catSelect) {
          const name = nameInput.value.trim() || 'Custom Charge';
          const price = parseFloat(priceInput.value);
          const category = catSelect.value || 'custom';
          
          if (!isNaN(price) && price > 0) {
            const added = await store.addCustomProduct(name, price, category);
            if (added) {
              // Reset and close
              form.reset();
              store.closeModal();
            }
          } else {
            store.showToast(i18n.t('toast.invalid_amount'));
          }
        }
      });
    }
  }

  render() {
    if (store.state.activeModal !== 'custom_product') {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-fade-in">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 animate-scale-up relative p-6">
          
          <!-- Top Close X Button -->
          <button class="close-modal absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>

          <!-- Modal Header -->
          <h3 class="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2" data-i18n="custom_product.title">
            <i class="fa-solid fa-calculator text-orange-500"></i>
            ${i18n.t('custom_product.title')}
          </h3>

          <!-- Form Content -->
          <form id="custom-product-form" class="space-y-4">
            
            <!-- Item Name -->
            <div class="space-y-1">
              <label for="custom-name" class="text-xs font-semibold text-gray-500 dark:text-neutral-400" data-i18n="custom_product.name_label">
                ${i18n.t('custom_product.name_label')}
              </label>
              <input 
                type="text" 
                id="custom-name"
                required
                data-i18n-attr="placeholder:custom_product.name_placeholder"
                placeholder="${i18n.t('custom_product.name_placeholder')}"
                class="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white transition-colors placeholder-gray-500 dark:placeholder-neutral-500"
              />
            </div>

            <!-- Price & Category row -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Price -->
              <div class="space-y-1">
                <label for="custom-price" class="text-xs font-semibold text-gray-500 dark:text-neutral-400" data-i18n="custom_product.price_label">
                  ${i18n.t('custom_product.price_label')}
                </label>
                <div class="relative">
                  <input 
                    type="number" 
                    id="custom-price"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    class="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <!-- Category -->
              <div class="space-y-1">
                <label for="custom-cat" class="text-xs font-semibold text-gray-500 dark:text-neutral-400" data-i18n="custom_product.category_label">
                  ${i18n.t('custom_product.category_label')}
                </label>
                <div class="relative bg-gray-100 dark:bg-neutral-800 rounded-xl px-3 py-2.5 flex items-center">
                  <select 
                    id="custom-cat" 
                    class="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-700 dark:text-neutral-200 cursor-pointer"
                  >
                    <option value="custom">Custom</option>
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                    <option value="desserts">Desserts</option>
                    <option value="merch">Merch</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Add Button -->
            <div class="pt-4 border-t border-gray-100 dark:border-neutral-800 mt-6 flex justify-end gap-2">
              <button 
                type="button"
                class="close-modal py-2.5 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                data-i18n="checkout.cancel"
              >
                ${i18n.t('checkout.cancel')}
              </button>
              <button 
                type="submit"
                class="py-2.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center gap-1"
              >
                <i class="fa-solid fa-cart-plus"></i>
                <span data-i18n="custom_product.add_btn">${i18n.t('custom_product.add_btn')}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    this.bindEvents();
  }
}
export default CustomProductModal;
