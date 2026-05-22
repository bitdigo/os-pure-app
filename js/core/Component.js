// Tiny component base for the app's native ES module UI.
import { store } from '../store.js';

export class Component {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribers = [];
    this.eventCleanups = [];

    if (!this.container) {
      console.warn(`Component container #${containerId} was not found.`);
    }
  }

  watch(keys, callback = () => this.render()) {
    keys.forEach(key => {
      this.unsubscribers.push(store.subscribe(key, callback));
    });
  }

  setHtml(markup) {
    if (!this.container) return;
    this.clearEvents();
    this.container.innerHTML = markup;
  }

  on(eventName, selector, handler) {
    if (!this.container) return;

    const listener = event => {
      const target = event.target.closest(selector);
      if (!target || !this.container.contains(target)) return;
      handler(event, target);
    };

    this.container.addEventListener(eventName, listener);
    this.eventCleanups.push(() => {
      this.container.removeEventListener(eventName, listener);
    });
  }

  clearEvents() {
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];
  }

  destroy() {
    this.clearEvents();
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[char];
  });
}
