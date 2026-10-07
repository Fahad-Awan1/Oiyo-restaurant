// Shared boot for every page. Page entries import this first, then add their
// own behaviour via onReady().
import { $, $$, gsap, initScroll, flushReady, toast, reducedMotion } from './core.js';
import { runPreloader } from './preloader.js';
import { initNav } from './nav.js';
import { initHours } from './hours.js';
import { initTray } from './tray.js';
import { initMotion } from './motion.js';
import { initCursor } from './cursor.js';
import { initSound } from './sound.js';
import { initPageTransitions, arrive } from './pageTransition.js';

initScroll();
initPageTransitions();
initNav();
initHours();
initTray();
initCursor();
initSound();
initChatLauncher();
initNewsletter();

// fonts settle the layout; never wait on them for more than a moment
const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1800))]);
Promise.all([runPreloader(), fontsReady]).then(arrive).then(() => {
  initMotion();
  heroEntrance();
  flushReady();
});

/* ----- chat: markup ships in the page, logic loads on first open ----------- */
function initChatLauncher() {
  const host = $('[data-chat]');
  if (!host) return;
  let mod = null;
  const load = () => (mod ??= import('./chatbot/chatbot.js').then((m) => m.mountChat(host)));

  $$('[data-chat-toggle]', host).forEach((b) => b.addEventListener('click', () => load().then((chat) => chat.toggle())));
  // Any element on the page can open the chat with a pre-filled question.
  document.addEventListener('click', (e) => {
    const ask = e.target.closest('[data-chat-ask]');
    if (!ask) return;
    e.preventDefault();
    load().then((chat) => chat.open(ask.dataset.chatAsk));
  });
  // Warm the module when the visitor hovers the launcher.
  $('.chat__launcher', host)?.addEventListener('pointerenter', load, { once: true });

  // Gentle teaser once per session.
  const teaser = $('[data-chat-teaser]', host);
  let seen = false;
  try { seen = sessionStorage.getItem('oiyo:teaser') === '1'; } catch {}
  if (!seen && teaser) {
    setTimeout(() => {
      if (host.classList.contains('is-open')) return;
      teaser.hidden = false;
      setTimeout(() => (teaser.hidden = true), 12000); // don't linger over content
    }, 9000);
    const dismiss = () => {
      teaser.hidden = true;
      try { sessionStorage.setItem('oiyo:teaser', '1'); } catch {}
    };
    $('[data-chat-teaser-close]', host).addEventListener('click', dismiss);
    teaser.addEventListener('click', (e) => {
      if (e.target.closest('[data-chat-teaser-close]')) return;
      dismiss();
      load().then((chat) => chat.open());
    });
    host.addEventListener('chat:open', dismiss);
  }
}

function initNewsletter() {
  $$('[data-newsletter]').forEach((form) =>
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.querySelector('.newsletter__msg');
      if (!input.checkValidity() || !input.value) {
        msg.textContent = 'That email doesn’t look quite right.';
        input.focus();
        return;
      }
      // Hook up to your email provider (Mailchimp, Buttondown…) here.
      msg.textContent = 'Thank you. The next Journal letter is on its way to you.';
      form.reset();
      toast('<svg class="icon" aria-hidden="true"><use href="#i-check" /></svg> You’re on the Journal list');
    })
  );
}

function heroEntrance() {
  const items = $$('[data-hero-in]');
  if (!items.length) return;
  if (reducedMotion) return gsap.set(items, { opacity: 1, y: 0 });
  gsap.to(items, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.3 });
}
