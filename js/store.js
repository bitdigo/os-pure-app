// Reactive State Store (Pub-Sub Pattern)
import { db } from './db.js';
import { i18n } from './i18n.js';

// Default list of high-quality products
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Espresso Double', price: 3.50, category: 'drinks', image: 'https://images.unsplash.com/photo-151097252790b-a638d6228a4c?auto=format&fit=crop&w=300&q=80' },
  { id: 'p2', name: 'Cold Brew Coffee', price: 4.50, category: 'drinks', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80' },
  { id: 'p3', name: 'Avocado Toast', price: 9.00, category: 'food', image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=300&q=80' },
  { id: 'p4', name: 'Cheeseburger & Fries', price: 12.00, category: 'food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
  { id: 'p5', name: 'Fudge Brownie', price: 5.00, category: 'desserts', image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=300&q=80' },
  { id: 'p6', name: 'Glazed Donut', price: 3.00, category: 'desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80' },
  { id: 'p7', name: 'BitDigo Orange Hoodie', price: 45.00, category: 'merch', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80' },
  { id: 'p8', name: 'Bitcoin Genesis Cap', price: 25.00, category: 'merch', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80' },
  { id: 'p9', name: 'Satoshis Ceramic Mug', price: 15.00, category: 'merch', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80' }
];

export const VALID_COUPONS = {
  'BITCOIN21': { code: 'BITCOIN21', type: 'percent', value: 21 },
  'SATS100': { code: 'SATS100', type: 'amount', value: 1.00 },
  'VIP15': { code: 'VIP15', type: 'percent', value: 15 },
  'FREECOFFEE': { code: 'FREECOFFEE', type: 'amount', value: 3.50 }
};

class Store {
  constructor() {
    this.state = {
      products: [],
      cart: [],
      categories: ['all', 'food', 'drinks', 'desserts', 'merch', 'custom'],
      currentCategory: 'all',
      searchQuery: '',
      activeLanguage: 'en',
      theme: 'dark',
      taxRate: 0.07, // 7%
      discountType: 'percent', // 'percent' or 'amount'
      discountValue: 0,
      appliedCoupon: null,
      transactions: [],
      pendingOrders: [],
      activeInvoice: null,
      currentRoute: 'dashboard',
      previousRoute: null,
      routeQuery: {},
      activeModal: null,
      toast: null
    };

    // Subscriptions registry: map of state key -> array of callbacks
    this.listeners = new Map();
  }

  // Initialize Store
  async init() {
    // 1. Load settings from LocalStorage
    const savedLanguage = db.getSetting('language', 'en');
    const savedTheme = db.getSetting('theme', 'dark');
    
    this.state.activeLanguage = savedLanguage;
    this.state.theme = savedTheme;

    // Apply translations
    await i18n.setLocale(savedLanguage);

    // Apply theme to document
    this.applyTheme(savedTheme);

    // 2. Initialize IndexedDB
    try {
      await db.init();
      // Load catalog products from database
      let dbProducts = await db.getProducts();
      if (dbProducts.length === 0) {
        // Pre-populate database with default products
        for (const prod of DEFAULT_PRODUCTS) {
          await db.saveProduct(prod);
        }
        dbProducts = [...DEFAULT_PRODUCTS];
      }
      this.state.products = dbProducts;
      
      // Load transaction history
      await this.loadTransactions();
      // Load pending orders
      this.state.pendingOrders = await db.getPendingOrders();
      this.notify('pendingOrders');
    } catch (e) {
      console.error('IndexedDB initialization failed, falling back to in-memory.', e);
      this.state.products = [...DEFAULT_PRODUCTS];
    }
  }

  // Subscribe to changes in a specific state key
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key) || [];
      this.listeners.set(key, callbacks.filter(cb => cb !== callback));
    };
  }

  // Notify all subscribers of a key
  notify(key) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(this.state[key], this.state));
    }
  }

  // --- Theme Helper ---
  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // --- ACTIONS (State Mutators) ---

  // Set color theme
  setTheme(theme) {
    this.state.theme = theme;
    db.setSetting('theme', theme);
    this.applyTheme(theme);
    this.notify('theme');
  }

  // Set active language
  async setLanguage(lang) {
    await i18n.setLocale(lang);
    this.state.activeLanguage = lang;
    db.setSetting('language', lang);
    this.notify('activeLanguage');
    
    // Toast notification for language update
    this.showToast(i18n.t('toast.language_updated', { lang }));
  }

  // Set category filter
  setCategory(category) {
    this.state.currentCategory = category;
    this.notify('currentCategory');
  }

  // Set search query
  setSearchQuery(query) {
    this.state.searchQuery = query;
    this.notify('searchQuery');
  }

  // Set active app route. Keep this light: routes are for pages, not modals.
  setRoute(route, query = {}) {
    const nextRoute = route || 'pos';
    if (this.state.currentRoute === nextRoute && JSON.stringify(this.state.routeQuery) === JSON.stringify(query)) return;
    this.state.previousRoute = this.state.currentRoute;
    this.state.currentRoute = nextRoute;
    this.state.routeQuery = query;
    this.notify('currentRoute');
  }

  // Open a modal by name: checkout, history, catalog, pending_orders, table, etc.
  openModal(modalName) {
    if (this.state.activeModal === modalName) return;
    this.state.activeModal = modalName;
    this.notify('activeModal');
  }

  // Close the current modal.
  closeModal() {
    if (!this.state.activeModal) return;
    this.state.activeModal = null;
    this.notify('activeModal');
  }

  // Add item to cart
  addToCart(product) {
    const existingIndex = this.state.cart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += 1;
    } else {
      this.state.cart.push({
        product,
        quantity: 1
      });
    }
    
    this.notify('cart');
    this.showToast(i18n.t('toast.item_added', { name: product.name }));
  }

  // Update item quantity in cart
  updateCartQty(productId, quantity) {
    if (quantity <= 0) {
      this.state.cart = this.state.cart.filter(item => item.product.id !== productId);
    } else {
      const item = this.state.cart.find(item => item.product.id === productId);
      if (item) {
        item.quantity = quantity;
      }
    }
    this.notify('cart');
  }

  // Remove item from cart
  removeFromCart(productId) {
    this.state.cart = this.state.cart.filter(item => item.product.id !== productId);
    this.notify('cart');
  }

  // Set cart discount rate (percentage preset)
  setDiscountRate(rate) {
    this.state.discountType = 'percent';
    this.state.discountValue = rate;
    this.state.appliedCoupon = null; // Clear coupon when setting manual discount
    this.notify('cart'); // Totals depend on discount
  }

  // Set custom discount type and value
  setCustomDiscount(type, value) {
    this.state.discountType = type;
    this.state.discountValue = Math.max(0, parseFloat(value) || 0);
    this.state.appliedCoupon = null; // Clear coupon when setting manual discount
    this.notify('cart');
  }

  // Apply a coupon code
  applyCoupon(code) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      this.state.appliedCoupon = null;
      this.state.discountValue = 0;
      this.notify('cart');
      return { success: true, message: 'Coupon removed' };
    }

    const coupon = VALID_COUPONS[cleanCode];
    if (coupon) {
      this.state.appliedCoupon = coupon;
      this.state.discountType = coupon.type;
      this.state.discountValue = coupon.value;
      this.notify('cart');
      this.showToast(i18n.t('toast.coupon_applied', { code: cleanCode }));
      return { success: true, coupon };
    } else {
      this.showToast(i18n.t('toast.invalid_coupon'));
      return { success: false, message: 'Invalid coupon' };
    }
  }

  // Remove applied coupon
  removeCoupon() {
    this.state.appliedCoupon = null;
    this.state.discountValue = 0;
    this.notify('cart');
  }

  // Catalog CRUD Operations
  async saveCatalogProduct(product) {
    try {
      await db.saveProduct(product);
      const index = this.state.products.findIndex(p => p.id === product.id);
      if (index > -1) {
        this.state.products[index] = product;
      } else {
        this.state.products.push(product);
      }
      this.notify('products');
      this.showToast(i18n.t('toast.catalog_updated') || 'Catalog updated');
      return true;
    } catch (e) {
      console.error('Failed to save product:', e);
      return false;
    }
  }

  async deleteCatalogProduct(productId) {
    try {
      await db.deleteProduct(productId);
      this.state.products = this.state.products.filter(p => p.id !== productId);
      this.notify('products');
      
      // Remove from active cart if it's currently in there
      const inCart = this.state.cart.some(item => item.product.id === productId);
      if (inCart) {
        this.state.cart = this.state.cart.filter(item => item.product.id !== productId);
        this.notify('cart');
      }
      this.showToast(i18n.t('toast.catalog_deleted') || 'Item deleted from catalog');
      return true;
    } catch (e) {
      console.error('Failed to delete product:', e);
      return false;
    }
  }

  // Park current order / hold bill
  async holdCurrentOrder(reference, tableId = null) {
    if (this.state.cart.length === 0) return null;
    
    const id = tableId ? `TABLE-${tableId}` : `PEND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const refName = reference.trim() || (tableId ? `Table ${tableId.replace('T', '')}` : `Order #${Date.now().toString().slice(-4)}`);
    const totals = this.getCartTotals();
    
    const newPending = {
      id: id,
      tableId: tableId,
      reference: refName,
      timestamp: new Date().toISOString(),
      cart: JSON.parse(JSON.stringify(this.state.cart)), // Deep clone
      discountType: this.state.discountType,
      discountValue: this.state.discountValue,
      appliedCoupon: this.state.appliedCoupon,
      subtotal: totals.subtotal,
      total: totals.total
    };

    try {
      // Remove existing pending order for this ID (updating existing table order)
      const existingIndex = this.state.pendingOrders.findIndex(o => o.id === id);
      if (existingIndex > -1) {
        await db.deletePendingOrder(id);
        this.state.pendingOrders.splice(existingIndex, 1);
      }

      await db.savePendingOrder(newPending);
      this.state.pendingOrders.unshift(newPending);
      this.notify('pendingOrders');
      
      // Clear active cart without triggering generic clear toast
      this.state.cart = [];
      this.state.discountType = 'percent';
      this.state.discountValue = 0;
      this.state.appliedCoupon = null;
      this.notify('cart');
      
      this.showToast(i18n.t('toast.order_held', { name: refName }));
      return newPending;
    } catch (e) {
      console.error('Failed to hold order:', e);
      return null;
    }
  }

  // Merge current cart items into table order
  async mergeCartIntoTable(tableId) {
    if (this.state.cart.length === 0) return false;
    
    const existing = this.state.pendingOrders.find(o => o.id === `TABLE-${tableId}`);
    if (!existing) {
      await this.holdCurrentOrder(`Table ${tableId.replace('T', '')}`, tableId);
      return true;
    }

    const mergedCart = JSON.parse(JSON.stringify(existing.cart));
    for (const activeItem of this.state.cart) {
      const idx = mergedCart.findIndex(item => item.product.id === activeItem.product.id);
      if (idx > -1) {
        mergedCart[idx].quantity += activeItem.quantity;
      } else {
        mergedCart.push(JSON.parse(JSON.stringify(activeItem)));
      }
    }

    // Recompute totals for merged cart by temporarily context switching cart
    const oldCart = this.state.cart;
    const oldDiscountType = this.state.discountType;
    const oldDiscountValue = this.state.discountValue;
    const oldCoupon = this.state.appliedCoupon;

    this.state.cart = mergedCart;
    this.state.discountType = existing.discountType || 'percent';
    this.state.discountValue = existing.discountValue || 0;
    this.state.appliedCoupon = existing.appliedCoupon || null;

    const totals = this.getCartTotals();

    // Restore state context
    this.state.cart = oldCart;
    this.state.discountType = oldDiscountType;
    this.state.discountValue = oldDiscountValue;
    this.state.appliedCoupon = oldCoupon;

    existing.cart = mergedCart;
    existing.subtotal = totals.subtotal;
    existing.total = totals.total;
    existing.timestamp = new Date().toISOString();

    try {
      await db.savePendingOrder(existing);
      this.notify('pendingOrders');
      
      this.state.cart = [];
      this.state.discountType = 'percent';
      this.state.discountValue = 0;
      this.state.appliedCoupon = null;
      this.notify('cart');

      this.showToast(i18n.t('toast.table_merged', { num: tableId.replace('T', '') }) || `Merged order into Table ${tableId.replace('T', '')}`);
      return true;
    } catch (e) {
      console.error('Failed to merge table:', e);
      return false;
    }
  }

  // Restore held order to active cart
  async resumePendingOrder(orderId) {
    const order = this.state.pendingOrders.find(o => o.id === orderId);
    if (!order) return false;

    // Load state
    this.state.cart = JSON.parse(JSON.stringify(order.cart));
    this.state.discountType = order.discountType || 'percent';
    this.state.discountValue = order.discountValue || 0;
    this.state.appliedCoupon = order.appliedCoupon || null;
    this.notify('cart');

    // Remove from database and state
    await this.deletePendingOrder(orderId);
    
    this.showToast(i18n.t('toast.order_resumed', { name: order.reference }));
    return true;
  }

  // Delete held order
  async deletePendingOrder(orderId) {
    const orderIndex = this.state.pendingOrders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      const order = this.state.pendingOrders[orderIndex];
      try {
        await db.deletePendingOrder(orderId);
        this.state.pendingOrders.splice(orderIndex, 1);
        this.notify('pendingOrders');
        this.showToast(i18n.t('toast.order_deleted', { name: order.reference }));
        return true;
      } catch (e) {
        console.error('Failed to delete pending order:', e);
      }
    }
    return false;
  }

  // Clear all items in cart
  clearCart() {
    this.state.cart = [];
    this.state.discountType = 'percent';
    this.state.discountValue = 0;
    this.state.appliedCoupon = null;
    this.notify('cart');
    this.showToast(i18n.t('toast.cart_cleared'));
  }

  // Add custom charge product
  async addCustomProduct(name, price, category = 'custom') {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      this.showToast(i18n.t('toast.invalid_amount'));
      return null;
    }

    const newProduct = {
      id: `custom_${Date.now()}`,
      name,
      price: numericPrice,
      category,
      isCustom: true
    };

    // Save to IndexedDB
    try {
      await db.saveCustomProduct(newProduct);
    } catch (e) {
      console.warn('Could not save custom product to IndexedDB:', e);
    }

    // Update state and add directly to cart
    this.state.products.push(newProduct);
    this.notify('products');
    this.addToCart(newProduct);
    return newProduct;
  }

  // --- Transactions ---

  // Load all transactions from IndexedDB
  async loadTransactions() {
    try {
      this.state.transactions = await db.getAllTransactions();
      this.notify('transactions');
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
  }

  // Add a new transaction (completed order)
  async addTransaction(txData) {
    const tx = {
      id: `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      items: this.state.cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      subtotal: txData.subtotal,
      discount: txData.discount,
      tax: txData.tax,
      total: txData.total,
      paymentMethod: txData.paymentMethod,
      paymentDetails: txData.paymentDetails || {},
      refunded: false
    };

    try {
      await db.saveTransaction(tx);
      this.state.transactions.unshift(tx); // Add to beginning of history list
      this.notify('transactions');
      this.showToast(i18n.t('toast.transaction_saved'));
      return tx;
    } catch (e) {
      console.error('Failed to save transaction:', e);
      return null;
    }
  }

  // Refund transaction
  async refundTransaction(txId) {
    const tx = this.state.transactions.find(t => t.id === txId);
    if (tx) {
      tx.refunded = true;
      try {
        await db.updateTransaction(tx);
        this.notify('transactions');
        this.showToast(i18n.t('toast.transaction_refunded'));
        return true;
      } catch (e) {
        console.error('Failed to refund transaction:', e);
      }
    }
    return false;
  }

  // Clear all transaction history
  async clearHistory() {
    try {
      await db.clearTransactions();
      this.state.transactions = [];
      this.notify('transactions');
      this.showToast(i18n.t('toast.history_cleared'));
    } catch (e) {
      console.error('Failed to clear transaction history:', e);
    }
  }

  // --- UI Toasts ---
  showToast(message) {
    this.state.toast = {
      id: Date.now(),
      message
    };
    this.notify('toast');
  }

  // Calculate cart totals
  getCartTotals() {
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (this.state.discountType === 'percent') {
      discountAmount = subtotal * (this.state.discountValue / 100);
    } else if (this.state.discountType === 'amount') {
      discountAmount = this.state.discountValue;
    }

    // Clamp discount to not exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);
    discountAmount = Math.max(0, discountAmount);

    const taxableSubtotal = subtotal - discountAmount;
    const taxAmount = taxableSubtotal * this.state.taxRate;
    const total = taxableSubtotal + taxAmount;

    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total
    };
  }
}

export const store = new Store();
export default store;
