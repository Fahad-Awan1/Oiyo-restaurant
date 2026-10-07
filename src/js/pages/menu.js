import '../main.js';
import { ScrollTrigger, $, $$, reducedMotion, scrollToTarget } from '../core.js';
import { heroParticles } from '../three/gate.js';

heroParticles($('[data-particles]'), { beans: 12, leaves: 12 });

const season = document.documentElement.dataset.season;
$$('[data-season-name]').forEach((el) => (el.textContent = `${season} edition`));

const cards = $$('[data-menu-grid] .p-card');
const countEl = $('[data-menu-count]');
const emptyEl = $('[data-menu-empty]');
const search = $('[data-menu-search]');
const state = { cat: 'all', diet: new Set(), q: '' };
const CATS = ['coffee', 'matcha', 'pastries', 'breakfast', 'pantry'];

function apply({ animate = true } = {}) {
  const q = state.q.trim().toLowerCase();
  const shown = [];
  cards.forEach((card) => {
    const tags = card.dataset.tags.split(' ');
    const ok =
      (state.cat === 'all' || card.dataset.cat === state.cat) &&
      [...state.diet].every((d) => tags.includes(d)) &&
      (!q || card.dataset.name.includes(q));
    card.classList.toggle('is-hidden', !ok);
    if (ok) shown.push(card);
  });
  countEl.textContent = shown.length;
  emptyEl.hidden = shown.length > 0;
  $$('[data-cat-filter]').forEach((b) => {
    const on = b.dataset.catFilter === state.cat;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  $$('[data-diet]').forEach((b) => b.setAttribute('aria-pressed', String(state.diet.has(b.dataset.diet))));
  if (animate && !reducedMotion) {
    // replay the CSS reveal with a short cascade
    shown.forEach((c, i) => {
      c.style.setProperty('--d', `${Math.min(i, 10) * 0.04}s`);
      c.classList.remove('is-in');
    });
    void document.body.offsetWidth;
    shown.forEach((c) => c.classList.add('is-in'));
  }
  ScrollTrigger.refresh();
}

$$('[data-cat-filter]').forEach((b) =>
  b.addEventListener('click', () => {
    state.cat = b.dataset.catFilter;
    history.replaceState(null, '', state.cat === 'all' ? location.pathname + location.search : `#${state.cat}`);
    apply();
  })
);
$$('[data-diet]').forEach((b) =>
  b.addEventListener('click', () => {
    const d = b.dataset.diet;
    state.diet.has(d) ? state.diet.delete(d) : state.diet.add(d);
    apply();
  })
);
let t = 0;
search?.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.q = search.value;
    apply();
  }, 160);
});
$('[data-menu-reset]')?.addEventListener('click', () => {
  state.cat = 'all';
  state.diet.clear();
  state.q = '';
  search.value = '';
  apply();
});

// Deep links: /menu.html#matcha, /menu.html?diet=v (used by Dew, the chatbot)
function fromUrl() {
  const hash = location.hash.slice(1);
  const diet = new URLSearchParams(location.search).get('diet');
  if (diet && ['v', 'gf', 'nf'].includes(diet)) state.diet.add(diet);
  if (CATS.includes(hash)) {
    state.cat = hash;
    apply({ animate: false });
    requestAnimationFrame(() => scrollToTarget('#menu-list', { immediate: true }));
  } else if (diet) {
    apply({ animate: false });
  }
}
fromUrl();
addEventListener('hashchange', () => {
  const hash = location.hash.slice(1);
  if (CATS.includes(hash)) {
    state.cat = hash;
    apply();
    scrollToTarget('#menu-list');
  }
});
