// Header behaviour: scrolled/hidden states, coffee-line scroll progress,
// mobile menu with focus handling, back-to-top.
import { $, $$, lenis, scrollToTarget } from './core.js';

export function initNav() {
  const header = $('#site-header');
  const line = $('[data-scroll-line]');
  const burger = $('.burger');
  const menu = $('#mobile-menu');
  let lastY = scrollY;
  let menuOpen = false;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen) header.classList.toggle('is-hidden', y > 320 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    if (line) line.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.remove('is-hidden');
    document.body.style.overflow = open ? 'hidden' : '';
    document.documentElement.classList.toggle('overlay-open', open);
    open ? lenis?.stop() : lenis?.start();
    $$('a, button', menu).forEach((el) => (el.tabIndex = open ? 0 : -1));
    if (open) setTimeout(() => $('a', menu)?.focus(), 350);
  };
  $$('a, button', menu).forEach((el) => (el.tabIndex = -1));
  burger?.addEventListener('click', () => setMenu(!menuOpen));
  menu?.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      setMenu(false);
      burger.focus();
    }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && menuOpen && setMenu(false));

  $$('[data-back-top]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(0, { offset: 0 });
    })
  );

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}
