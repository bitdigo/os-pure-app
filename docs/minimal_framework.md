# Minimal Frontend Framework

This project stays dependency-free and uses native ES modules. The small reusable layer lives in `js/core/Component.js`.

For the full Vue-like project conventions, see `docs/developer_guidelines.md`.
For route, state, and folder structure rules, see `docs/app_structure.md`.

## What It Provides

- `Component`: base class for mounted UI modules.
- `watch(keys)`: subscribe to store keys and re-render automatically.
- `setHtml(markup)`: replace component HTML and clean old delegated events.
- `on(event, selector, handler)`: delegated event binding scoped to the component.
- `destroy()`: unsubscribe and remove listeners if a component is ever unmounted.
- `escapeHtml(value)`: safely render user/catalog text in template strings.

## Component Pattern

```js
import { store } from '../store.js';
import { Component, escapeHtml } from '../core/Component.js';

export class ExamplePanel extends Component {
  constructor(containerId) {
    super(containerId);
    this.watch(['cart', 'activeLanguage']);
    this.render();
  }

  bindEvents() {
    this.on('click', '.example-btn', () => {
      store.showToast('Clicked');
    });
  }

  render() {
    this.setHtml(`
      <button class="example-btn">
        ${escapeHtml(store.state.activeLanguage)}
      </button>
    `);

    this.bindEvents();
  }
}
```

Use this for new UI modules first. Existing components can be migrated gradually without changing the app build or adding Vue/Nuxt/Vite.

## Reusable Logic

Put shared, non-DOM feature logic in `js/composables/` using `useSomething.js` naming. Components should stay focused on rendering and events; composables should hold reusable calculations, filters, validators, and workflow helpers.
