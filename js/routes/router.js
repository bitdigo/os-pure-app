const DEFAULT_ROUTE = 'dashboard';

const ROUTES = new Set([
  'dashboard',
  'pos',
  'transactions',
  'history',
  'catalog',
  'settings'
]);

function readHashRoute() {
  const route = window.location.hash.replace(/^#\/?/, '').trim();
  if (route === 'history') return 'transactions';
  return ROUTES.has(route) ? route : DEFAULT_ROUTE;
}

function writeHashRoute(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

export function initRouter(store) {
  function syncRouteFromHash() {
    const route = readHashRoute();
    store.setRoute(route);
  }

  if (!window.location.hash) {
    writeHashRoute(DEFAULT_ROUTE);
  }

  syncRouteFromHash();
  window.addEventListener('hashchange', syncRouteFromHash);

  store.subscribe('currentRoute', route => {
    const nextRoute = route || DEFAULT_ROUTE;
    writeHashRoute(nextRoute);
  });
}
