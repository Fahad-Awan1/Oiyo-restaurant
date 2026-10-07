// Build-time HTML renderers. Used by the include plugin in vite.config.js via
// `<!-- @render <name> -->` so menu/journal content ships as static HTML
// (crawlable, no layout shift, zero runtime cost).
import { menu, tagLabels } from './menu.js';
import { posts, journalCats } from './journal.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const money = (n) => `$${n.toFixed(2)}`;

export const picture = (name, alt, sizes = '(min-width: 1100px) 300px, (min-width: 600px) 45vw, 50vw', { eager = false, cls = '' } = {}) =>
  `<img class="${cls}" src="/img/${name}-sm.webp" srcset="/img/${name}-sm.webp 640w, /img/${name}-md.webp 960w, /img/${name}-lg.webp 1400w" sizes="${sizes}" alt="${esc(alt)}" width="640" height="480" ${
    eager ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async" />`;

const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}" /></svg>`;

export function productCard(item) {
  const tags = item.tags.filter((t) => t === 'new' || t === 'seasonal');
  const diet = item.tags.filter((t) => ['v', 'gf', 'nf'].includes(t));
  return `
<article class="p-card" data-reveal data-cat="${item.cat}" data-tags="${item.tags.join(' ')}" data-name="${esc(item.name.toLowerCase())} ${esc(item.desc.toLowerCase())}">
  <div class="p-card__media" data-tilt>
    ${picture(item.img, item.name)}
    <span class="chip-icon">${icon(item.icon)}</span>
    ${tags.map((t) => `<span class="p-card__flag p-card__flag--${t}">${tagLabels[t]}</span>`).join('')}
  </div>
  <div class="p-card__body">
    <h3 class="p-card__title">${esc(item.name)}</h3>
    <p class="p-card__desc">${esc(item.desc)}</p>
    ${diet.length ? `<p class="p-card__diet">${diet.map((t) => `<span title="${tagLabels[t]}">${t.toUpperCase()}</span>`).join('')}</p>` : ''}
    <div class="p-card__foot">
      <span class="price">${money(item.price)}</span>
      <button class="btn-add" type="button" data-add="${item.id}" aria-label="Add ${esc(item.name)} to your tray">${icon('i-plus')}</button>
    </div>
  </div>
</article>`;
}

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const catLabel = (id) => journalCats.find((c) => c.id === id)?.label ?? id;

export function postCard(p, { feature = false } = {}) {
  return `
<article class="j-card${feature ? ' j-card--feature' : ''}" data-reveal data-cat="${p.cat}">
  <a class="j-card__link" href="/journal.html#${p.id}" data-article="${p.id}">
    <div class="j-card__media">${picture(p.img, '', feature ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw')}</div>
    <div class="j-card__body">
      <p class="j-card__meta"><span class="tag">${catLabel(p.cat)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.read} min read</p>
      <h3 class="j-card__title">${esc(p.title)}</h3>
      <p class="j-card__excerpt">${esc(p.excerpt)}</p>
      <span class="link-arrow">Read more ${icon('i-arrow')}</span>
    </div>
  </a>
</article>`;
}

export function articleTemplates() {
  return posts
    .map(
      (p) => `
<template id="article-${p.id}">
  <article class="article">
    <div class="article__media">${picture(p.img, '', '(min-width: 900px) 760px, 100vw')}</div>
    <div class="article__body">
      <p class="j-card__meta"><span class="tag">${catLabel(p.cat)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.read} min read</p>
      <h2 class="article__title">${esc(p.title)}</h2>
      ${p.body.map((para) => `<p>${esc(para)}</p>`).join('\n      ')}
      <p class="article__sign">With care, the Oiyo team ${icon('i-sprig')}</p>
    </div>
  </article>
</template>`
    )
    .join('');
}

export const renderers = {
  'signature-cards': () => menu.filter((m) => m.signature).map(productCard).join(''),
  'menu-grid': () => menu.map(productCard).join(''),
  'journal-preview': () => posts.slice(0, 3).map((p) => postCard(p)).join(''),
  'journal-grid': () => posts.map((p, i) => postCard(p, { feature: i === 0 })).join(''),
  'journal-articles': articleTemplates,
};
