# Composables

Put reusable feature logic here. This folder follows a Vue-like convention while staying plain JavaScript and native ES modules.

Use composables for shared calculations, filters, format adapters, validation, or workflow helpers that do not belong to one component.

Example:

```js
// js/composables/useProductFilters.js
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

Rules:

- Name files with `useSomething.js`.
- Export a function with the same name.
- Keep DOM work inside components, not composables.
- Prefer pure functions that receive data as arguments.
- Return an object of named helpers.
