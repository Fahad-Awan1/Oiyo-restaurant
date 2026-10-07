// On-brand dropdowns for form <select>s. The native select stays in the DOM as
// the source of truth (form value, `change` events, existing page logic); this
// layer only replaces its look. Options rebuilt by code (e.g. time slots for a
// new date) are picked up automatically.
//
// <select data-ui="grid" data-cols="4">  → options shown as a grid of chips
// <select>                               → elegant list with check marks
import { $$ } from './core.js';

let uid = 0;
let openOne = null;

export function enhanceSelects(root = document) {
  $$('select[data-enhance]', root).forEach(enhance);
}

function enhance(select) {
  if (select.dataset.enhanced) return;
  select.dataset.enhanced = '1';
  const id = `cs-${++uid}`;
  const grid = select.dataset.ui === 'grid';
  const field = select.closest('.field') || select.parentElement;
  const label = field.querySelector(`label[for="${select.id}"]`);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cselect__btn';
  btn.id = `${id}-btn`;
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', `${id}-list`);

  const panel = document.createElement('div');
  panel.className = `cselect__panel${grid ? ' cselect__panel--grid' : ''}`;
  panel.setAttribute('data-lenis-prevent', '');
  const list = document.createElement('ul');
  list.className = 'cselect__list';
  list.id = `${id}-list`;
  list.tabIndex = -1;
  list.setAttribute('role', 'listbox');
  if (grid) list.style.setProperty('--cols', select.dataset.cols || 4);
  if (label) {
    label.id ||= `${id}-label`;
    label.htmlFor = btn.id;
    list.setAttribute('aria-labelledby', label.id);
    btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`);
  }
  if (select.dataset.panelTitle) {
    const t = document.createElement('p');
    t.className = 'cselect__title';
    t.textContent = select.dataset.panelTitle;
    panel.append(t);
  }
  panel.append(list);

  // the native select stays for the form, hidden from sight and focus
  select.classList.add('cselect__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.after(btn);
  field.classList.add('cselect');
  field.append(panel);

  let active = 0;
  const options = () => [...list.children];

  function build() {
    list.innerHTML = '';
    [...select.options].forEach((o, i) => {
      const li = document.createElement('li');
      li.id = `${id}-o${i}`;
      li.className = 'cselect__opt';
      li.setAttribute('role', 'option');
      li.dataset.index = i;
      li.innerHTML = grid
        ? `<span>${o.dataset.short || o.text}</span>`
        : `<span>${o.text}</span><svg class="icon cselect__check" aria-hidden="true"><use href="#i-check" /></svg>`;
      if (o.title) li.title = o.title;
      if (o.disabled || !o.value && select.required) li.setAttribute('aria-disabled', 'true');
      list.append(li);
    });
    sync();
  }

  function sync() {
    const i = select.selectedIndex;
    options().forEach((li, k) => li.setAttribute('aria-selected', String(k === i)));
    btn.textContent = select.options[i]?.text ?? '';
    btn.disabled = select.options.length === 0 || (select.options.length === 1 && !select.options[0].value);
  }

  function setActive(i) {
    const opts = options();
    if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach((li, k) => li.classList.toggle('is-active', k === active));
    list.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  function choose(i) {
    const li = options()[i];
    if (!li || li.getAttribute('aria-disabled') === 'true') return;
    if (select.selectedIndex !== i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    close(true);
  }

  function open() {
    if (btn.disabled) return;
    openOne?.close();
    openOne = { close };
    field.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    setActive(Math.max(0, select.selectedIndex));
    requestAnimationFrame(() => list.focus({ preventScroll: true }));
  }
  function close(refocus = false) {
    if (!field.classList.contains('is-open')) return;
    field.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    list.removeAttribute('aria-activedescendant');
    if (openOne?.close === close) openOne = null;
    if (refocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (field.classList.contains('is-open') ? close() : open()));
  btn.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open();
    }
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.cselect__opt');
    if (li) choose(Number(li.dataset.index));
  });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('.cselect__opt');
    if (li && Number(li.dataset.index) !== active) setActive(Number(li.dataset.index));
  });
  list.addEventListener('keydown', (e) => {
    const cols = grid ? Number(select.dataset.cols || 4) : 1;
    const moves = { ArrowDown: cols, ArrowUp: -cols, ArrowRight: grid ? 1 : 0, ArrowLeft: grid ? -1 : 0 };
    if (e.key in moves && moves[e.key]) {
      e.preventDefault();
      setActive(Math.min(options().length - 1, Math.max(0, active + moves[e.key])));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : options().length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close();
    } else if (e.key.length === 1) {
      // type-ahead: jump to the next option starting with that character
      const k = e.key.toLowerCase();
      const opts = options();
      for (let s = 1; s <= opts.length; s++) {
        const j = (active + s) % opts.length;
        if (opts[j].textContent.trim().toLowerCase().startsWith(k)) return setActive(j);
      }
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!field.contains(e.target)) close();
  });

  select.addEventListener('change', sync);
  // options rewritten by page code (e.g. new time slots) → rebuild
  new MutationObserver(build).observe(select, { childList: true });
  build();
}
