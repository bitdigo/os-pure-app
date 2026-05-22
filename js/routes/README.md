# Routes

This app uses a tiny hash router in `js/routes/router.js`.

Current route state is stored at:

```js
store.state.currentRoute
```

Use routes only for full pages:

- `#/pos`
- `#/history`
- `#/catalog`
- `#/settings`

Current example behavior:

- `#/pos` shows the main POS workspace.
- `#/history` opens the existing history modal.
- `#/catalog` opens the existing catalog modal.

Use `store.state.activeModal` for workflow modals like checkout, pending orders, and table selection.

Change routes with:

```js
store.setRoute('history');
```

Open modals with:

```js
store.openModal('checkout');
store.closeModal();
```

Keep routing hash-based so the app still works as static files.
