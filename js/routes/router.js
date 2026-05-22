const DEFAULT_ROUTE = 'pos';

const ROUTES = new Set([
  'pos',
  'history',
  'catalog',
  'settings'
]);

const ROUTE_MODALS = {
  history: 'history',
  catalog: 'catalog'
};

function readHashRoute() {
  const route = window.location.hash.replace(/^#\/?/, '').trim();
  return ROUTES.has(route) ? route : DEFAULT_ROUTE;
}

function writeHashRoute(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

export function initRouter(store) {
  function applyRouteEffects(route) {
    if (ROUTE_MODALS[route]) {
      store.openModal(ROUTE_MODALS[route]);
    } else if (route === DEFAULT_ROUTE) {
      store.closeModal();
    }
  }

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
    applyRouteEffects(nextRoute);
  });

  store.subscribe('activeModal', modal => {
    if (!modal && store.state.currentRoute !== DEFAULT_ROUTE) {
      store.setRoute(DEFAULT_ROUTE);
    }
  });
}
