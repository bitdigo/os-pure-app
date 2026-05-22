# Routes

This app uses a tiny hash router in `js/routes/router.js`.

Current route state is stored at:

```js
store.state.currentRoute
```

Use routes only for full pages:

- `#/dashboard`
- `#/pos`
- `#/transactions`
- `#/catalog`
- `#/settings`

Current example behavior:

- `#/dashboard` shows dashboard metrics.
- `#/pos` shows the product grid and cart.
- `#/transactions` shows the sales ledger and refund actions.
- `#/catalog` shows product catalog management.

Use `store.state.activeModal` for workflow modals like checkout, pending orders, and table selection.

Change routes with:

```js
store.setRoute('transactions');
```

Open modals with:

```js
store.openModal('checkout');
store.closeModal();
```

Keep routing hash-based so the app still works as static files.

Use clean URLs like `/transactions` only after adding server rewrite rules back to `index.html`.
