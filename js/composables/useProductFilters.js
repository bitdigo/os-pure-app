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
