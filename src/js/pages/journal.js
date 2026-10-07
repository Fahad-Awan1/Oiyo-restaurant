import '../main.js';
import { $, $$, lenis, ScrollTrigger } from '../core.js';
import { heroParticles } from '../three/gate.js';

heroParticles($('[data-particles]'), { beans: 8, leaves: 10, palette: ['#a7b98d', '#cdb8a1', '#5f6b3d'] });

/* ----- category filter -------------------------------------------------- */
const cards = $$('[data-journal-grid] .j-card');
$$('[data-jfilter]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const f = btn.dataset.jfilter;
    $$('[data-jfilter]').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    cards.forEach((c, i) => {
      const show = f === 'all' || c.dataset.cat === f;
      c.classList.toggle('is-hidden', !show);
      // the feature layout only makes sense in the unfiltered view
      c.classList.toggle('j-card--feature', f === 'all' && i === 0);
      if (show) {
        c.classList.remove('is-in');
        void c.offsetWidth;
        c.classList.add('is-in');
      }
    });
    ScrollTrigger.refresh();
  })
);

/* ----- article modal ---------------------------------------------------- */
const modal = $('[data-article-modal]');
const content = $('[data-modal-content]');

function openArticle(id, { push = true } = {}) {
  const tpl = document.getElementById(`article-${id}`);
  if (!tpl) return;
  content.replaceChildren(tpl.content.cloneNode(true));
  content.scrollTop = 0;
  modal.showModal();
  lenis?.stop();
  if (push) history.replaceState(null, '', `#${id}`);
}
function closeArticle() {
  modal.close();
}
modal.addEventListener('close', () => {
  lenis?.start();
  history.replaceState(null, '', location.pathname);
});
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeArticle(); // backdrop click
});
$('[data-modal-close]').addEventListener('click', closeArticle);

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-article]');
  if (!a || !location.pathname.endsWith('journal.html')) return;
  e.preventDefault();
  openArticle(a.dataset.article);
});

// deep links: /journal.html#how-we-whisk (used by the home page and Dew)
const initial = location.hash.slice(1);
if (initial) setTimeout(() => openArticle(initial, { push: false }), 400);
