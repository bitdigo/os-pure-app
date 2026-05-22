// Translation and Internationalization Manager

class I18nManager {
  constructor() {
    this.locale = 'en';
    this.translations = {};
    this.fallbackLocale = 'en';
    this.listeners = [];
  }

  // Set active locale and load translation dictionary
  async setLocale(locale) {
    if (this.locale === locale && Object.keys(this.translations).length > 0) {
      return;
    }

    try {
      const response = await fetch(`./locales/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load locale file: ${locale}`);
      }
      this.translations = await response.json();
      this.locale = locale;
      
      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', locale);
      
      // Notify listeners of the change
      this.notify(locale);
      
      // Re-translate current DOM
      this.translateDOM();
    } catch (error) {
      console.error(`Error loading locale "${locale}":`, error);
      if (locale !== this.fallbackLocale) {
        console.warn(`Falling back to "${this.fallbackLocale}"`);
        await this.setLocale(this.fallbackLocale);
      }
    }
  }

  // Subscribe to locale changes
  onLocaleChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(locale) {
    this.listeners.forEach(cb => cb(locale));
  }

  // Resolve nested keys e.g., 'app.title'
  resolveKey(key, dict) {
    return key.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : null;
    }, dict);
  }

  // Translate a key with variable interpolation
  t(key, vars = {}) {
    let text = this.resolveKey(key, this.translations);
    
    // Fallback if key is missing in active locale
    if (text === null) {
      console.warn(`Missing key: "${key}" for locale "${this.locale}"`);
      // Optionally we could load the fallback file, but for simplicity:
      text = key;
    }

    // Interpolate variables e.g., {name} -> 'Bitcoin Merch'
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    });

    return text;
  }

  // Scan the document and translate elements matching data-i18n
  translateDOM() {
    // 1. Text content translation
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // 2. Attribute translation (e.g., placeholders, titles)
    // Format: data-i18n-attr="placeholder:nav.search_placeholder"
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const attrConfig = el.getAttribute('data-i18n-attr');
      if (attrConfig) {
        const parts = attrConfig.split(';');
        parts.forEach(part => {
          const [attr, key] = part.split(':');
          if (attr && key) {
            el.setAttribute(attr.trim(), this.t(key.trim()));
          }
        });
      }
    });
  }

  // Localized Currency Formatter
  formatCurrency(value) {
    let localeStr = 'en-US';
    let currencyStr = 'USD';

    switch (this.locale) {
      case 'es':
        localeStr = 'es-ES';
        currencyStr = 'EUR';
        break;
      case 'th':
        localeStr = 'th-TH';
        currencyStr = 'THB';
        break;
      default:
        localeStr = 'en-US';
        currencyStr = 'USD';
    }

    return new Intl.NumberFormat(localeStr, {
      style: 'currency',
      currency: currencyStr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Localized Date/Time Formatter
  formatDate(dateInput) {
    const date = new Date(dateInput);
    let localeStr = 'en-US';
    
    switch (this.locale) {
      case 'es':
        localeStr = 'es-ES';
        break;
      case 'th':
        localeStr = 'th-TH';
        break;
      default:
        localeStr = 'en-US';
    }

    return new Intl.DateTimeFormat(localeStr, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  // Satoshis Formatter
  formatSats(sats) {
    return new Intl.NumberFormat(this.locale === 'th' ? 'th-TH' : 'en-US').format(Math.round(sats)) + ' sats';
  }
}

export const i18n = new I18nManager();
