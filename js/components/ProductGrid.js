// Product Grid Component
import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';
import { useProductFilters } from '../composables/useProductFilters.js';

export class ProductGrid extends Component {
  constructor(containerId) {
    super(containerId);
    this.productFilters = useProductFilters();
    
    // Subscribe to state changes to trigger re-renders
    this.watch(['products', 'currentCategory', 'searchQuery', 'activeLanguage']);

    this.render();
  }

  // Bind interaction event listeners
  bindEvents() {
    this.on('click', '.product-card', (_event, card) => {
      const id = card.getAttribute('data-id');
      const product = store.state.products.find(p => p.id === id);
      if (product) {
        store.addToCart(product);
      }
    });
  }

  render() {
    if (!this.container) return;

    const { products, currentCategory, searchQuery } = store.state;

    const filteredProducts = this.productFilters.filterProducts(products, currentCategory, searchQuery);

    if (filteredProducts.length === 0) {
      this.setHtml(`
        <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500 mb-4">
            <i class="fa-solid fa-box-open text-2xl"></i>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white text-base">No items found</h3>
          <p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">Try adjusting your search query or category filters.</p>
        </div>
      `);
      return;
    }

    this.setHtml(`
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 sm:p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        ${filteredProducts.map(p => {
          const formattedPrice = i18n.formatCurrency(p.price);
          const hasImage = p.image;
          const productName = escapeHtml(p.name);
          const productCategory = escapeHtml(p.category);
          const productImage = escapeHtml(p.image);
          
          return `
            <div 
              data-id="${escapeHtml(p.id)}"
              class="product-card group relative bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-neutral-950/50 hover:border-orange-500/30 dark:hover:border-orange-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex flex-col"
            >
              <!-- Product Image -->
              <div class="relative aspect-square w-full bg-gray-50 dark:bg-neutral-950 overflow-hidden flex items-center justify-center">
                ${hasImage 
                  ? `<img 
                       src="${productImage}" 
                       alt="${productName}" 
                       loading="lazy"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     />`
                  : `<div class="text-gray-300 dark:text-neutral-700 flex flex-col items-center gap-2">
                       <i class="fa-solid ${p.category === 'custom' ? 'fa-calculator' : 'fa-box'} text-4xl"></i>
                       ${p.isCustom ? `<span class="text-[10px] uppercase font-bold tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Custom</span>` : ''}
                     </div>`
                }
                
                <!-- Floating Action Button -->
                <div class="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-gray-700 dark:text-neutral-200 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
                  <i class="fa-solid fa-plus text-xs"></i>
                </div>
              </div>

              <!-- Product Info -->
              <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-1">
                <span class="text-xs font-semibold text-orange-500 tracking-wide uppercase text-[10px]">
                  ${productCategory}
                </span>
                <h4 class="font-medium text-gray-900 dark:text-neutral-100 text-sm sm:text-base line-clamp-2">
                  ${productName}
                </h4>
                <p class="font-bold text-orange-600 dark:text-orange-500 text-base mt-1">
                  ${formattedPrice}
                </p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `);

    this.bindEvents();
  }
}
