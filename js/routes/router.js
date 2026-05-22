const DEFAULT_ROUTE = 'dashboard';

const ROUTE_REGISTRY = {
  dashboard: {
    path: 'dashboard',
    title: 'Dashboard',
    icon: 'fa-chart-pie',
    meta: { navbar: true, showCart: false }
  },
  pos: {
    path: 'pos',
    title: 'POS',
    icon: 'fa-cash-register',
    meta: { navbar: true, showCart: true }
  },
  transactions: {
    path: 'transactions',
    title: 'Transactions',
    icon: 'fa-receipt',
    meta: { navbar: true, showCart: false }
  },
  catalog: {
    path: 'catalog',
    title: 'Catalog',
    icon: 'fa-store',
    meta: { navbar: true, showCart: false }
  },
  settings: {
    path: 'settings',
    title: 'Settings',
    icon: 'fa-gear',
    meta: { navbar: true, showCart: false }
  }
};

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  const [pathSegment, queryString] = raw.split('?');
  const path = (pathSegment || '').trim();
  const query = {};

  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }

  return { path, query };
}

function resolveRoute(rawPath) {
  if (rawPath === 'history') return 'transactions';
  if (ROUTE_REGISTRY[rawPath]) return rawPath;
  return DEFAULT_ROUTE;
}

function readHashRoute() {
  const { path, query } = parseHash();
  const route = resolveRoute(path);
  return { route, params: {}, query };
}

function buildHash(route, query = {}) {
  const base = `#/${route}`;
  const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return base;
  return `${base}?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

function writeHashRoute(route, query = {}) {
  const nextHash = buildHash(route, query);
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function getRouteConfig(routeName) {
  return ROUTE_REGISTRY[routeName] || null;
}

function getAllRoutes() {
  return Object.values(ROUTE_REGISTRY);
}

export function initRouter(store) {
  store._routerHistory = [];

  function syncRouteFromHash() {
    const { route, query } = readHashRoute();
    store._routerHistory.push({ route, query, timestamp: Date.now() });
    store.setRoute(route, query);
  }

  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    writeHashRoute(DEFAULT_ROUTE);
  }

  syncRouteFromHash();
  window.addEventListener('hashchange', syncRouteFromHash);

  store.subscribe('currentRoute', route => {
    const nextRoute = route || DEFAULT_ROUTE;
    const currentQuery = store.state.routeQuery || {};
    writeHashRoute(nextRoute, currentQuery);
  });
}

export { ROUTE_REGISTRY, getRouteConfig, getAllRoutes, buildHash, DEFAULT_ROUTE };
export default { initRouter, getRouteConfig, getAllRoutes, buildHash, DEFAULT_ROUTE };
