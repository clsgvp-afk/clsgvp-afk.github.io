(function () {
  'use strict';
  // Static portfolio demo: no backend, orders, customer details or payments.
  // Only product IDs and quantities are retained in this browser tab.
  const catalog = Object.freeze({
    '118': { name: 'Morgenbrot Sauerteig', cents: 480 },
    '119': { name: 'Dinkelvollkornbrot', cents: 460 },
    '120': { name: 'Bauernbrot', cents: 440 },
    '121': { name: 'Klassisches Brötchen', cents: 55 },
    '122': { name: 'Körnerbrötchen', cents: 95 },
    '123': { name: 'Laugenbrötchen', cents: 90 },
    '124': { name: 'Buttercroissant', cents: 190 },
    '125': { name: 'Apfeltasche', cents: 240 },
    '126': { name: 'Apfelkuchen', cents: 320 },
    '127': { name: 'Käsekuchen', cents: 290 },
    '128': { name: 'Käse-Laugenstange', cents: 280 },
    '129': { name: 'Filterkaffee', cents: 220 },
  });
  const hasProduct = (id) => Object.prototype.hasOwnProperty.call(catalog, id);
  const validQuantity = (value) => /^\d+$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 50;
  const cleanCart = (input) => {
    const result = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
    Object.entries(input).forEach(([id, qty]) => {
      if (hasProduct(id) && validQuantity(qty)) result[id] = Number(qty);
    });
    return result;
  };
  const addProduct = (input, id, qty) => {
    const cart = cleanCart(input);
    if (hasProduct(id) && validQuantity(qty)) cart[id] = Math.min(50, (cart[id] || 0) + Number(qty));
    return cart;
  };
  const totalCents = (input) => Object.entries(cleanCart(input)).reduce((total, [id, qty]) => total + catalog[id].cents * qty, 0);
  if (typeof module !== 'undefined' && module.exports) module.exports = { catalog, validQuantity, cleanCart, addProduct, totalCents };
  if (typeof document === 'undefined') return;

  const root = '/morgenbrot-full/';
  const storageKey = 'morgenbrot-demo-cart-v1';
  const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const money = (cents) => currency.format(cents / 100);
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const link = (text, path) => {
    const element = make('a', 'button', text);
    element.href = root + path;
    return element;
  };
  let cart = {};
  let storageAvailable = true;
  try { cart = cleanCart(JSON.parse(sessionStorage.getItem(storageKey) || '{}')); }
  catch (_) { storageAvailable = false; }
  const save = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch (_) { storageAvailable = false; }
  };
  const css = make('link');
  css.rel = 'stylesheet'; css.href = root + 'wp-content/themes/morgenbrot/assets/css/demo-preorder.css';
  document.head.append(css);
  const notice = make('aside', 'demo-notice');
  notice.setAttribute('aria-label', 'Hinweis zur Portfolio-Demo');
  notice.append(make('strong', '', 'Interaktive Portfolio-Demo'), make('span', '', 'Fiktive Bäckerei · kein Verkauf, keine Bestellung und keine Zahlung.'));
  const cartLink = link('Demo-Auswahl ansehen', 'vorbestellen/');
  notice.append(cartLink);
  document.querySelector('.site-header')?.after(notice);

  const app = document.querySelector('[data-preorder-app]');
  const live = make('p', 'demo-live');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  const updateCount = () => {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    cartLink.textContent = 'Demo-Auswahl (' + count + ')';
  };
  const render = (message = '') => {
    updateCount();
    if (!app) return;
    app.replaceChildren();
    const intro = make('section', 'demo-explanation');
    intro.append(make('h2', '', 'Vorbestellung ausprobieren'), make('p', '', 'Produkte wählen → Mengen bearbeiten → Vorschau bestätigen. Dieser Ablauf läuft ausschließlich im Browser. Das WordPress-Backend wird hier nicht ausgeführt.'), make('p', '', storageAvailable
      ? 'Nur Produktnummern und Mengen werden für diesen Browser-Tab gespeichert. Keine Kontaktdaten, keine Übermittlung an eine Bäckerei.'
      : 'Browser-Speicher ist nicht verfügbar. Die Auswahl bleibt nur auf dieser Seite erhalten. Keine Kontaktdaten oder Übermittlung.'));
    app.append(intro); live.textContent = message; app.append(live);
    const form = make('form', 'cart-form'); form.setAttribute('data-demo-cart', '');
    form.append(make('h2', '', 'Ihre Demo-Auswahl'));
    const ids = Object.keys(cart);
    if (!ids.length) {
      const empty = make('div', 'empty');
      empty.append(make('h3', '', 'Noch keine Produkte ausgewählt'), make('p', '', 'Wählen Sie im Sortiment ein Produkt für die lokale Vorschau.'), link('Zum Sortiment', 'sortiment/'));
      form.append(empty); app.append(form); return;
    }
    ids.forEach((id) => {
      const item = make('div', 'cart-item demo-cart-item');
      const details = make('div', 'demo-item-details');
      details.append(make('strong', '', catalog[id].name), make('small', '', money(catalog[id].cents) + ' pro Stück · ' + money(catalog[id].cents * cart[id]) + ' gesamt'));
      const label = make('label', '', 'Menge'); const input = make('input');
      input.type = 'number'; input.min = '1'; input.max = '50'; input.step = '1';
      input.name = 'quantity_' + id; input.value = String(cart[id]); input.required = true;
      input.setAttribute('aria-label', 'Menge für ' + catalog[id].name); label.append(input);
      const remove = make('button', 'remove-item', 'Entfernen'); remove.type = 'button';
      remove.setAttribute('aria-label', catalog[id].name + ' entfernen');
      remove.addEventListener('click', () => { delete cart[id]; save(); render(catalog[id].name + ' wurde entfernt.'); app.querySelector('input, a, button')?.focus(); });
      item.append(details, label, remove); form.append(item);
    });
    const total = make('p', 'cart-total');
    total.append(make('span', '', 'Demo-Gesamtsumme'), make('strong', '', money(totalCents(cart))));
    const controls = make('div', 'demo-actions');
    const update = make('button', 'button', 'Mengen aktualisieren'); update.type = 'submit';
    const clear = make('button', 'remove-item', 'Auswahl leeren'); clear.type = 'button';
    clear.addEventListener('click', () => { cart = {}; save(); render('Die Demo-Auswahl wurde geleert.'); app.querySelector('a')?.focus(); });
    controls.append(update, link('Weitere Produkte', 'sortiment/'), clear); form.append(total, controls); app.append(form);
    const preview = make('section', 'demo-preview');
    preview.append(make('h2', '', 'Vorschau abschließen'), make('p', '', 'Es werden bewusst keine Namen, E-Mail-Adressen oder Zahlungsdaten abgefragt. Auch nach der Bestätigung entsteht keine echte Bestellung.'));
    const confirm = make('button', 'button', 'Demo-Vorschau bestätigen'); confirm.type = 'button';
    const result = make('div', 'demo-result'); result.hidden = true;
    result.setAttribute('role', 'status'); result.tabIndex = -1;
    confirm.addEventListener('click', () => {
      if (!form.reportValidity()) return;
      // Read current fields even when the separate update button was skipped.
      ids.forEach((id) => { cart[id] = Number(form.elements['quantity_' + id].value); });
      cart = cleanCart(cart); save(); updateCount();
      const summary = make('ul');
      Object.entries(cart).forEach(([id, qty]) => summary.append(make('li', '', qty + ' × ' + catalog[id].name + ' — ' + money(catalog[id].cents * qty))));
      result.replaceChildren(make('h3', '', 'Demo abgeschlossen — nichts wurde versendet'), summary, make('p', '', 'Vorschau: ' + money(totalCents(cart)) + '. Keine Bestellung, Reservierung oder Zahlung.'), make('p', '', 'Die echte PHP-Verarbeitung und Admin-Funktionen gehören zur separaten WordPress-Installation, nicht zu dieser statischen Vorschau.'));
      result.hidden = false; result.focus(); total.lastElementChild.textContent = money(totalCents(cart));
      form.querySelectorAll('.demo-item-details small').forEach((element, index) => {
        const id = ids[index]; element.textContent = money(catalog[id].cents) + ' pro Stück · ' + money(catalog[id].cents * cart[id]) + ' gesamt';
      });
    });
    form.addEventListener('input', () => { result.hidden = true; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      ids.forEach((id) => { cart[id] = Number(form.elements['quantity_' + id].value); });
      cart = cleanCart(cart); save(); render('Mengen und Demo-Gesamtsumme wurden aktualisiert.'); app.querySelector('.demo-preview button')?.focus();
    });
    preview.append(confirm, result); app.append(preview);
  };
  let queryMessage = '';
  if (app) {
    const url = new URL(window.location.href);
    if (url.searchParams.has('product')) {
      const id = url.searchParams.get('product'); const qty = url.searchParams.get('qty') || '1';
      if (hasProduct(id) && validQuantity(qty)) {
        cart = addProduct(cart, id, qty); save();
        queryMessage = catalog[id].name + ' wurde zur Demo-Auswahl hinzugefügt (max. 50 je Produkt).';
      } else queryMessage = 'Ungültiges Produkt oder ungültige Menge. Bitte wählen Sie ein Produkt im Sortiment.';
      // Consume this add operation once; refreshing must not double quantities.
      url.searchParams.delete('product'); url.searchParams.delete('qty');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }
  render(queryMessage);
  document.addEventListener('submit', (event) => {
    if (event.defaultPrevented) return;
    event.preventDefault(); // No exported form is permitted to submit to a server.
    const form = event.target;
    if (form.matches('form.inline-order')) {
      const id = form.elements.product?.value; const qty = form.elements.qty?.value;
      if (hasProduct(id) && validQuantity(qty)) {
        const query = new URLSearchParams({ product: id, qty });
        window.location.assign(root + 'vorbestellen/?' + query.toString());
      }
      return;
    }
    const status = make('p', 'demo-live', 'Portfolio-Demo: Dieses Formular übermittelt keine Daten.');
    status.setAttribute('role', 'status'); form.append(status);
  });
})();
