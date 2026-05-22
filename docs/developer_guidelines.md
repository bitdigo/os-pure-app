# Developer Guidelines

BitDigo POS uses a small Vue-like frontend pattern built with native ES modules. There is no build step, no compiler, and no framework runtime. Keep new code modular, reusable, and predictable by following the structure below.

For the route, state, service, and folder structure overview, see `docs/app_structure.md`.

## Project Style

Think in the same layers Vue encourages:

- Components render UI and handle DOM events.
- Composables contain reusable functions and feature logic.
- Store actions mutate shared app state and notify subscribers.
- Routes are hash-based and sync into `store.state.currentRoute`.
- Services wrap browser APIs such as IndexedDB, LocalStorage, fetch, and printers.
- Locale files own user-facing translated text.

Current folders:

```text
js/
├── app.js              # App bootstrap and top-level coordination
├── core/
│   └── Component.js    # Tiny component base class
├── components/         # Mounted UI modules
├── composables/        # Reusable feature helpers and pure functions
├── routes/             # Optional hash-route notes and future route modules
├── services/           # Optional browser/API integration wrappers
├── db.js               # IndexedDB and LocalStorage persistence
├── i18n.js             # Translation and formatting helpers
└── store.js            # Shared reactive state and actions
```

## Components

Use components for anything that mounts into the DOM, renders HTML, and reacts to user input. New components should extend `Component` from `js/core/Component.js`.

Component responsibilities:

- Read state from `store.state`.
- Subscribe to state keys with `this.watch([...])`.
- Render with `this.setHtml(markup)`.
- Bind events with `this.on(eventName, selector, handler)`.
- Call store actions for state changes.
- Escape user, product, or database text with `escapeHtml`.

Component file naming:

- Use PascalCase: `ProductGrid.js`, `TableModal.js`, `PaymentSummary.js`.
- Export one main class with the same name as the file.
- Keep component-local UI state as instance fields, for example `this.activeTab = 'coupon'`.

Basic component template:

```js
import { store } from '../store.js';
import { i18n } from '../i18n.js';
import { Component, escapeHtml } from '../core/Component.js';

export class ExamplePanel extends Component {
  constructor(containerId) {
    super(containerId);
    this.activeFilter = 'all';

    this.watch(['products', 'activeLanguage']);
    this.render();
  }

  bindEvents() {
    this.on('click', '.example-action', (_event, button) => {
      const id = button.getAttribute('data-id');
      store.showToast(`Clicked ${id}`);
    });
  }

  render() {
    const title = i18n.t('example.title');

    this.setHtml(`
      <section>
        <h2>${escapeHtml(title)}</h2>
        <button class="example-action" data-id="demo">
          ${escapeHtml(i18n.t('common.save'))}
        </button>
      </section>
    `);

    this.bindEvents();
  }
}
```

Mount it in `js/app.js`:

```js
import { ExamplePanel } from './components/ExamplePanel.js';

new ExamplePanel('example-panel');
```

Add the mount target in `index.html`:

```html
<div id="example-panel"></div>
```

## Component Rules

- Do not write directly to `document` from inside components unless the behavior is truly global.
- Do not attach many direct listeners after every render. Use `this.on()` delegated events.
- Do not mutate `store.state` directly from components except for legacy modal routing already used in the app. Prefer a store action.
- Always call `this.bindEvents()` after `this.setHtml()`.
- Use `data-id` and `data-*` attributes for event payloads.
- Keep render methods readable by moving repeated markup or calculations into helpers or composables.
- Add empty, loading, and error states when a user workflow can hit them.

## Composables

Composables are reusable plain JavaScript helpers, similar to Vue composables, but without framework lifecycle hooks. Put them in `js/composables/`.

Use a composable when:

- Two or more components need the same calculation or formatting helper.
- A component render method is getting too large.
- Logic can be tested or reasoned about without the DOM.
- A feature has reusable actions that do not need to live in global state.

Naming:

- File names start with `use`: `useCartTotals.js`, `usePaymentMethods.js`, `useProductFilters.js`.
- Export a function with the same name.
- Return named functions and values in an object.

Composable example:

```js
export function useProductFilters() {
  function filterProducts(products, category, searchQuery) {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter(product => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }

  return {
    filterProducts
  };
}
```

Use it from a component:

```js
import { useProductFilters } from '../composables/useProductFilters.js';

const { filterProducts } = useProductFilters();
const visibleProducts = filterProducts(products, currentCategory, searchQuery);
```

Composable rules:

- Prefer pure functions: same input, same output.
- Do not touch the DOM.
- Do not call `render()` from a composable.
- Avoid hidden state unless the composable clearly owns temporary feature state.
- If a composable needs app state, pass values in as arguments or call store actions explicitly.

## Store

Use `js/store.js` for shared state and app-wide actions.

Store responsibilities:

- Own shared state such as cart, products, language, theme, transactions, and pending orders.
- Persist or load data through `db.js`.
- Provide action methods such as `addToCart`, `setLanguage`, `holdCurrentOrder`, and `addTransaction`.
- Call `this.notify('stateKey')` after changing a state key.
- Show user feedback with `showToast`.
- Own route and modal state through `setRoute`, `openModal`, and `closeModal`.

Adding new state:

1. Add the default value in `this.state`.
2. Add action methods to change it.
3. Call `this.notify('newKey')` after mutation.
4. Components subscribe with `this.watch(['newKey'])`.
5. Persist through `db.js` only if the value must survive reloads.

Example action:

```js
store.setRoute('history');
store.openModal('checkout');
store.closeModal();
```

## Data And Persistence

Use `js/db.js` for browser storage:

- IndexedDB: products, transactions, pending orders, custom products.
- LocalStorage: lightweight settings such as language and theme.

Rules:

- Keep IndexedDB table access inside `db.js`.
- Store methods should call `db.js`; components should not call IndexedDB directly.
- Bump `DB_VERSION` when adding object stores or indexes.
- Keep database records serializable with plain objects, arrays, strings, numbers, and booleans.

## Internationalization

All user-facing text should go through `i18n.t(key)` or locale JSON files.

Rules:

- Add keys to every file in `locales/`: `en.json`, `es.json`, and `th.json`.
- Use nested keys by feature, for example `cart.clear` or `history.refund`.
- Use interpolation for dynamic values: `i18n.t('toast.item_added', { name })`.
- Use `i18n.formatCurrency`, `i18n.formatDate`, and `i18n.formatSats` instead of custom formatting.

## CSS And UI

The app uses Tailwind utility classes plus small custom CSS in `css/styles.css`.

Rules:

- Prefer existing spacing, colors, radius, borders, and dark mode patterns.
- Use `dark:` classes for dark theme support.
- Keep repeated custom animations in `css/styles.css`.
- Do not introduce a build-only CSS feature unless the project adds a build step.
- Keep cards and controls compact because this is an operational POS interface.

## Adding A New Feature

Use this checklist:

1. Define the user workflow and the state it needs.
2. Add reusable calculations to a composable if they are not UI-specific.
3. Add shared state and actions to `store.js`.
4. Add persistence methods to `db.js` if data must survive reloads.
5. Create or update a component in `js/components/`.
6. Mount the component in `app.js` and add its container in `index.html`.
7. Add locale keys to all locale files.
8. Verify render, events, empty states, language switching, dark mode, and reload behavior.

## Review Checklist

Before finishing a change, check:

- Components extend `Component` when possible.
- Rendered dynamic text is escaped with `escapeHtml`.
- State mutations happen through store actions.
- Changed state keys call `notify`.
- Event handlers are delegated with `this.on`.
- Repeated logic has moved to `js/composables`.
- User-facing strings are translated.
- IndexedDB schema changes bump `DB_VERSION`.
- The app still works by opening `index.html` or serving the folder locally.
