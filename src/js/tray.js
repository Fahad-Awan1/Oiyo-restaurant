// Order tray: a local, no-checkout basket the guest shows at the counter.
// Persists in localStorage; any `[data-add="<menu id>"]` button adds an item.
import { menu, seasonalTray } from '../data/menu.js';
import { $, $$, toast, money, lenis } from './core.js';
import { flyToTray } from './flyToTray.js';

const KEY = 'oiyo:tray';
const catalog = new Map([...menu, seasonalTray].map((m) => [m.id, m]));
let items = load();
let lastFocus = null;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

/** Add a catalog item by id, or a custom item ({ id, name, price, img, meta }).
 *  With `from`, the item's photo flies from that element into the tray first. */
export function addToTray(idOrItem, { silent = false, from = null } = {}) {
  const item = typeof idOrItem === 'string' ? catalog.get(idOrItem) : idOrItem;
  if (!item) return;
  const found = items.find((i) => i.id === item.id);
  if (found) found.qty += 1;
  else items.push({ id: item.id, name: item.name, price: item.price, img: item.img, meta: item.meta || '', qty: 1 });
  save();
  flyToTray(from, `/img/${item.img}-sm.webp`).then(() => {
    render(true);
    if (!silent) announce(item);
  });
}

function announce(item) {
  const t = toast(`<svg class="icon" aria-hidden="true"><use href="#i-check" /></svg> ${item.name} added to your tray <button type="button">View</button>`);
  t?.querySelector('button')?.addEventListener('click', openTray);
}

function setQty(id, delta) {
  const it = items.find((i) => i.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) items = items.filter((i) => i !== it);
  save();
  render();
}

function render(bump = false) {
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  $$('[data-tray-count]').forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
    if (bump) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
  const list = $('[data-tray-list]');
  if (!list) return;
  list.innerHTML = items
    .map(
      (i) => `
    <li class="tray-item">
      <img src="/img/${i.img}-sm.webp" alt="" width="64" height="64" loading="lazy" />
      <div>
        <p class="tray-item__name">${i.name}</p>
        ${i.meta ? `<p class="tray-item__meta">${i.meta}</p>` : ''}
        <p class="tray-item__price">${money(i.price)}</p>
      </div>
      <div class="stepper" role="group" aria-label="Quantity for ${i.name}">
        <button type="button" data-qty="-1" data-id="${i.id}" aria-label="Remove one"><svg class="icon" aria-hidden="true"><use href="#i-minus" /></svg></button>
        <output aria-live="polite">${i.qty}</output>
        <button type="button" data-qty="1" data-id="${i.id}" aria-label="Add one"><svg class="icon" aria-hidden="true"><use href="#i-plus" /></svg></button>
      </div>
    </li>`
    )
    .join('');
  $('[data-tray-empty]').hidden = items.length > 0;
  $('[data-tray-foot]').hidden = items.length === 0;
  $('[data-tray-total]').textContent = money(total);
}

export function openTray() {
  const tray = $('#tray');
  const overlay = $('.drawer-overlay');
  lastFocus = document.activeElement;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
  tray.classList.add('is-open');
  tray.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('overlay-open');
  lenis?.stop();
  setTimeout(() => tray.focus(), 100);
}
export function closeTray() {
  const tray = $('#tray');
  const overlay = $('.drawer-overlay');
  if (!tray.classList.contains('is-open')) return;
  overlay.classList.remove('is-visible');
  setTimeout(() => (overlay.hidden = true), 400);
  tray.classList.remove('is-open');
  tray.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('overlay-open');
  lenis?.start();
  lastFocus?.focus?.();
}

export function initTray() {
  render();
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const card = add.closest('.p-card, .feature-tray, [data-fly-from]');
      addToTray(add.dataset.add, { from: card?.querySelector('img') || add });
      add.classList.remove('is-added');
      void add.offsetWidth;
      add.classList.add('is-added');
      return;
    }
    if (e.target.closest('[data-tray-open]')) return openTray();
    if (e.target.closest('[data-tray-close]')) return closeTray();
    const q = e.target.closest('[data-qty]');
    if (q) return setQty(q.dataset.id, Number(q.dataset.qty));
    if (e.target.closest('[data-tray-clear]')) {
      items = [];
      save();
      render();
    }
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && closeTray());
  // keep tabs in sync
  addEventListener('storage', (e) => {
    if (e.key === KEY) {
      items = load();
      render();
    }
  });
}
