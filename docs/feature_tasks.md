# BitDigo POS - Step-by-Step Feature Implementation Guide

This document provides a detailed, step-by-step implementation guide of the features built into the **BitDigo POS** application. It serves as a reference checklist for maintaining, auditing, or replicating the application's core logic.

---

## 📂 Architecture Blueprint

The project is built entirely on native Web APIs and ES Modules (no compiler/bundler overhead) for maximum maintainability:

```text
pos-pure/
├── index.html                   # Shell layout, Tailwind configurations, & Modal Mounts
├── docs/
│   └── feature_tasks.md         # [THIS FILE] Implementation & checklist guide
├── css/
│   └── styles.css               # Toast slide-ins, custom scrollbars, LED blinkers, and modal fade anims
├── locales/
│   ├── en.json                  # English locales
│   ├── es.json                  # Spanish locales (Euro currency formatting)
│   └── th.json                  # Thai locales (Baht currency formatting)
└── js/
    ├── app.js                   # Main application coordinator & toast spawn engine
    ├── i18n.js                  # Internationalization, currency switcher, and date parser
    ├── db.js                    # IndexedDB manager (Transactions, Custom Products, Pending Bills)
    ├── store.js                 # Central state tree with Pub-Sub change dispatch notifications
    └── components/              # UI Component Modules
        ├── Navbar.js            # App bar, search query bind, theme/language selectors, category slider
        ├── ProductGrid.js       # Dynamic product display and search filter engine
        ├── CartPanel.js         # Quantity, Multi-type discount calculator, coupon check, checkout trigger
        ├── CheckoutModal.js     # Cash change, card processor, Bitcoin Lightning QR invoice generator
        ├── HistoryModal.js      # Sales analytics metrics, transaction logs, and refund actions
        ├── CustomProductModal.js# Form for adding customized ad-hoc products
        └── PendingOrdersModal.js# Held bills list with details expanding, restore, and delete features
```

---

## 🛠 Step-by-Step Feature Implementation Tasks

### 📍 Phase 1: Shell Layout & Custom Styling
- [x] Configure Tailwind CSS (via CDN) to hook custom animations, themes, and screen widths directly in `index.html`.
- [x] Implement smooth animations in `css/styles.css`:
  - `animate-fade-in` and `animate-scale-up` for premium glassmorphism modals.
  - `animate-toast-in` for overlay notifications sliding from the bottom right.
  - Custom scrollbar styling for lists, keeping inputs and checkout buttons visible at all times.
- [x] Create fixed-layout slots for modular overlays:
  - `<div id="checkout-modal-container"></div>`
  - `<div id="history-modal-container"></div>`
  - `<div id="custom-product-modal-container"></div>`
  - `<div id="pending-orders-modal-container"></div>`

### 📍 Phase 2: Reactive State & DB Setup
- [x] Establish a central `Store` class (`js/store.js`) implementing the Pub-Sub pattern:
  - Add state object managing: `cart`, `products`, `activeLanguage`, `theme`, `discountType`, `discountValue`, `appliedCoupon`, `transactions`, `pendingOrders`, etc.
  - Implement `subscribe(key, callback)` and `notify(key)` so UI modules automatically re-render when their observed data updates.
- [x] Implement `DbManager` (`js/db.js`) wrapping IndexedDB:
  - Upgrade database versions safely (Version `2` contains `transactions`, `customProducts`, and `pendingOrders` stores).
  - Define utility functions to store and fetch custom items, receipts, and parked bills.

### 📍 Phase 3: Dynamic Internationalization (i18n)
- [x] Build the translation dispatcher (`js/i18n.js`):
  - Load translation tables asynchronously via `fetch` from the `locales/` directory.
  - Implement translation function `t(key, replacements)` supporting variable interpolation (e.g. `{name}`).
- [x] Build locale-aware formatters:
  - `formatCurrency(value)`: Returns `$`, `€`, or `฿` formats based on active locale configuration.
  - `formatSats(value)`: Converts fiat amounts to Sats equivalents using a simulated BTC exchange rate.
  - `formatDate(isoString)`: Displays time/date configurations matching the operator's language conventions.

### 📍 Phase 4: Product Grid & Cart Operations
- [x] Implement search filters and category tags in `js/components/ProductGrid.js` to draw catalog items in real time.
- [x] Create checkout inputs in `js/components/CartPanel.js`:
  - Add quick buttons to increment, decrement, or remove items.
  - Mount custom toast alerts confirming catalog changes (e.g., *"Double Espresso added"*).
- [x] Build `js/components/CustomProductModal.js` to allow cashiers to create ad-hoc items on the fly and persist them to IndexedDB.

### 📍 Phase 5: Multi-type Discounts & Coupon Validation
- [x] Build a tabbed discount header inside `CartPanel.js` supporting three input modes:
  - **Percentage (`%`)**: Presets (0% to 20%) alongside a numeric entry field.
  - **Amount (`Amount`)**: Cash rate entry prefixed with the localized currency symbol ($ / € / ฿).
  - **Coupon (`Coupon`)**: Input field to validate coupon codes.
- [x] Define global coupon definitions in `store.js` (e.g. `BITCOIN21` for 21% off, `VIP15` for 15% off, `SATS100` for $1.00 off, and `FREECOFFEE` for $3.50 off).
- [x] Integrate calculations in `getCartTotals()` to deduct the discount rate safely and clamp calculations to avoid negative order totals.

### 📍 Phase 6: Checkout Gate & Simulated Payments
- [x] Design a secure checkout wizard (`js/components/CheckoutModal.js`) supporting:
  - **Cash**: Automated cash receipt tally and change calculation.
  - **Card**: Simulated connection step testing card terminal reading.
  - **Bitcoin Lightning**:
    - Convert total due into satoshis using simulated exchange rates.
    - Fetch a real QR scan layout via the public QR API.
    - Simulate payment verification in 5 seconds, triggering success animations.
- [x] Integrate print dialogue rules (`@media print` in `css/styles.css` and receipt layouts) to support physical ticket printing.

### 📍 Phase 7: Hold Orders / Pending Bills
- [x] Add a **Hold Bill** button inside the active cart panel:
  - Prompt the operator for a reference code (e.g. `Table 4` or customer name).
  - Execute `holdCurrentOrder(reference)` to save the order details to IndexedDB and clear the current cart.
- [x] Add a pause icon button to the navigation header containing a dynamic amber notification badge showing the number of active held bills.
- [x] Implement the `js/components/PendingOrdersModal.js` component:
  - View all parked bills with item breakdowns, timestamp details, and discount rates.
  - Click **Resume Order** to load the order back into the active cart workspace (with confirmation if the active cart already contains other items).
  - Click **Delete** to discard the held bill.

### 📍 Phase 8: Business History & Refunds
- [x] Implement `js/components/HistoryModal.js` to manage complete sales audits:
  - Render metrics tracking gross turnover, paid tickets, and refunded transactions.
  - Implement order details expansions to review subtotal splits, tax additions, and payment methods.
  - Add a **Refund** action to reverse transactions, mark receipt logs, and update dashboard revenue sums instantly.
