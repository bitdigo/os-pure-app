// IndexedDB and LocalStorage Persistence Layer

const DB_NAME = 'BitDigoPOSDatabase';
const DB_VERSION = 3;

class DbManager {
  constructor() {
    this.db = null;
  }

  // Initialize IndexedDB
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Transactions Object Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Custom Products Object Store
        if (!db.objectStoreNames.contains('customProducts')) {
          db.createObjectStore('customProducts', { keyPath: 'id', autoIncrement: true });
        }

        // Pending Orders Object Store
        if (!db.objectStoreNames.contains('pendingOrders')) {
          const pendingStore = db.createObjectStore('pendingOrders', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Catalog Products Object Store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
      };
    });
  }

  // --- Transactions ---

  // Save transaction
  saveTransaction(transaction) {
    return new Promise((resolve, reject) => {
      const transactionObj = this.db.transaction(['transactions'], 'readwrite');
      const store = transactionObj.objectStoreStore || transactionObj.objectStore('transactions');
      const request = store.put(transaction);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Fetch all transactions, sorted by timestamp descending
  getAllTransactions() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // prev = descending order

      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Update a transaction (e.g. for refund mark)
  updateTransaction(transaction) {
    return this.saveTransaction(transaction);
  }

  // Clear all transactions
  clearTransactions() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Custom Products ---

  // Save a custom product
  saveCustomProduct(product) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customProducts'], 'readwrite');
      const store = transaction.objectStore('customProducts');
      const request = store.put(product);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Fetch all custom products
  getCustomProducts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customProducts'], 'readonly');
      const store = transaction.objectStore('customProducts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Catalog Products ---

  saveProduct(product) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.put(product);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  getProducts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  deleteProduct(productId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.delete(productId);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Pending Orders ---

  savePendingOrder(order) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOrders'], 'readwrite');
      const store = transaction.objectStore('pendingOrders');
      const request = store.put(order);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  getPendingOrders() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOrders'], 'readonly');
      const store = transaction.objectStore('pendingOrders');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  deletePendingOrder(orderId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOrders'], 'readwrite');
      const store = transaction.objectStore('pendingOrders');
      const request = store.delete(orderId);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- LocalStorage Helpers for settings ---

  getSetting(key, defaultValue) {
    const value = localStorage.getItem(`bitdigo_setting_${key}`);
    return value !== null ? value : defaultValue;
  }

  setSetting(key, value) {
    localStorage.setItem(`bitdigo_setting_${key}`, value);
  }
}

export const db = new DbManager();
