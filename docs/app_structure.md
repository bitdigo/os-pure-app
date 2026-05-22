# App Structure

This project should stay minimal, light, and easy to follow. Use Vue-style organization, but keep everything plain JavaScript with native ES modules.

## Recommended Tree

```text
pos-pure/
├── index.html
├── css/
│   └── styles.css
├── docs/
│   ├── app_structure.md
│   ├── developer_guidelines.md
│   └── minimal_framework.md
├── locales/
│   ├── en.json
│   ├── es.json
│   └── th.json
└── js/
    ├── app.js
    ├── core/
    │   └── Component.js
    ├── components/
    │   ├── Navbar.js
    │   ├── ProductGrid.js
    │   ├── CartPanel.js
    │   └── *Modal.js
    ├── composables/
    │   └── useSomething.js
    ├── routes/
    │   ├── README.md
    │   └── router.js
    ├── services/
    │   └── README.md
    ├── db.js
    ├── i18n.js
    └── store.js
```

Use the folders only when needed. Do not create empty architecture for features that do not exist yet.

## Simple Mental Model

```text
index.html
  -> app.js starts the app
  -> store.js loads shared state
  -> components render UI
  -> components call store actions
  -> store actions call services/db
  -> store notifies components to re-render
```

## Routing

The app has a tiny hash router in `js/routes/router.js`. It syncs `window.location.hash` with `store.state.currentRoute`.

Use these rules:

- Use `#/pos` for the main POS workspace.
- Use `#/history` and `#/catalog` as working route examples. They open the existing modal screens.
- Use store state for modals: checkout, history, catalog, pending orders, tables.
- Add routes only when a feature is a real page, not just a modal.
- Prefer hash routes because this app can run as static files without a server rewrite.

Suggested routes if the app grows:

```text
#/pos          Main sales workspace
#/history      Full sales history page
#/catalog      Product catalog management page
#/settings     Store, theme, language, tax, and printer settings
```

Route state lives in `store.js`:

```js
state: {
  currentRoute: 'pos',
  activeModal: null
}
```

Change page route with a store action:

```js
store.setRoute('history');
```

Or with a URL hash:

```text
http://localhost:8000/#/history
```

The router is initialized in `js/app.js`:

```js
await store.init();
initRouter(store);
```

Modal state also lives in `store.js`:

```js
store.openModal('checkout');
store.closeModal();
```

Components watch modal state:

```js
store.subscribe('activeModal', () => this.render());
```

Keep route names simple and stable. Components should not parse URLs directly; they should read `store.state.currentRoute`.

Current route behavior:

```text
#/pos       closes route-backed modals and shows the POS workspace
#/history   sets currentRoute to "history" and opens the history modal
#/catalog   sets currentRoute to "catalog" and opens the catalog modal
```

## State

Put shared state in `store.js`.

Good store state:

- `products`
- `cart`
- `currentCategory`
- `searchQuery`
- `activeLanguage`
- `theme`
- `transactions`
- `pendingOrders`
- `activeModal`
- `currentRoute`

Do not put everything in global state. Keep these local to components:

- selected tab
- temporary form input
- expanded row id
- loading flag for one button
- local validation message

State rule:

```text
If many components need it, put it in store.
If only one component needs it, keep it on `this`.
If it must survive reload, persist it through db.js.
```

State update example:

```js
// Good: one action owns the change and notification.
store.openModal('catalog');

// Avoid: scattered direct writes from components.
store.state.activeModal = 'catalog';
store.notify('activeModal');
```

## Components

Components are for UI. They should be small and obvious.

Use this shape:

```js
export class FeaturePanel extends Component {
  constructor(containerId) {
    super(containerId);
    this.localValue = '';
    this.watch(['someStateKey']);
    this.render();
  }

  bindEvents() {
    this.on('click', '.save-btn', () => {
      store.saveSomething();
    });
  }

  render() {
    this.setHtml(`...`);
    this.bindEvents();
  }
}
```

Component rules:

- Render HTML.
- Bind DOM events.
- Read shared state.
- Call store actions.
- Avoid direct persistence calls.
- Avoid business calculations that can be reused elsewhere.

## Composables

Composables are plain reusable functions.

Use them for:

- filtering products
- validating forms
- calculating totals
- formatting small view models
- preparing payloads

Example:

```js
export function useExample() {
  function normalizeName(value) {
    return value.trim();
  }

  return {
    normalizeName
  };
}
```

Composable rules:

- No DOM access.
- No hidden side effects by default.
- Pass state in as arguments.
- Return named helper functions.

## Services

Services wrap external or browser APIs.

Examples:

- `db.js` for IndexedDB and LocalStorage.
- `services/printerService.js` for print helpers.
- `services/paymentService.js` for simulated payment methods.
- `services/qrService.js` for QR URL generation.

Service rules:

- No rendering.
- No direct UI event handling.
- Return data or promises.
- Let store actions decide how state changes after service calls.

## Naming

Use simple names:

- Components: `ProductGrid.js`, `CartPanel.js`, `SettingsPage.js`
- Composables: `useProductFilters.js`, `useCartTotals.js`
- Services: `paymentService.js`, `printerService.js`
- Store actions: `addToCart`, `clearCart`, `setLanguage`, `openModal`
- State keys: nouns like `cart`, `products`, `activeModal`

## Minimal Feature Flow

When adding a feature:

1. Add UI component if the user sees it.
2. Add composable if logic is reused or bulky.
3. Add store state only if shared.
4. Add store actions for mutations.
5. Add service/db methods if persistence or browser API is needed.
6. Add translations.
7. Mount component in `app.js`.
8. Add route only if it is a page.

## What To Avoid

- Do not add Vue, React, Vite, or a router package unless the project really outgrows this structure.
- Do not put all logic inside components.
- Do not let components call IndexedDB directly.
- Do not create nested folder trees before features need them.
- Do not use routes for simple modals.
- Do not mutate store state directly from many places. Add small store actions instead.
