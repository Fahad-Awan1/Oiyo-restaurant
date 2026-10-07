// Dew, the Oiyo chat host. Fully client-side: keyword + fuzzy intent
// matching against knowledge.js. Loaded lazily on first interaction.
import { intents, fallback, quickReplies, findDish } from './knowledge.js';
import { lenis } from '../core.js';

const STORE = 'oiyo:chat';

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9à-ÿ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

const WEIGHTS = { menu: 0.8, price: 1.2 };

/** Score every intent; returns the best match or null. */
export function match(question) {
  const q = normalize(question);
  const padded = ` ${q} `;
  const tokens = q.split(' ');
  let best = null;
  let bestScore = 0;
  for (const intent of intents) {
    let score = 0;
    for (const key of intent.keys) {
      if (key.includes(' ')) {
        if (padded.includes(` ${key} `)) score += key.split(' ').length * 2;
      } else if (tokens.includes(key)) {
        score += 1;
      } else if (key.length >= 4) {
        const tol = key.length > 7 ? 2 : 1;
        if (tokens.some((t) => t.length >= 4 && lev(t, key) <= tol)) score += 0.7;
      }
    }
    score *= intent.weight ?? WEIGHTS[intent.id] ?? 1;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  // A dish named outright ("tell me about the cinnamon knot") → describe it,
  // unless the question is clearly operational (booking, hours, allergies…).
  const OPERATIONAL = ['price', 'reserve', 'cancel', 'hours', 'open-now', 'location', 'allergy', 'vegan', 'gluten', 'order', 'private', 'chefs-table', 'workshops'];
  if (!best || !OPERATIONAL.includes(best.id)) {
    const item = findDish(q);
    if (item) return { id: 'item', answer: () => ({ html: `<strong>${item.name}</strong>: ${item.desc} ${'$' + item.price.toFixed(2)}.`, actions: [{ href: `/menu.html#${item.cat}`, label: 'See it on the menu' }] }) };
  }
  return bestScore >= 0.7 ? best : null;
}

export function reply(question) {
  const intent = match(question);
  const raw = intent ? (typeof intent.answer === 'function' ? intent.answer(question) : intent.answer) : fallback();
  return typeof raw === 'string' ? { html: raw } : raw;
}

export function mountChat(host) {
  const panel = host.querySelector('.chat__panel');
  const log = host.querySelector('[data-chat-log]');
  const chips = host.querySelector('[data-chat-chips]');
  const form = host.querySelector('[data-chat-form]');
  const input = host.querySelector('[data-chat-input]');
  const launcher = host.querySelector('.chat__launcher');
  let history = [];
  let isOpen = false;
  let busy = false;

  try { history = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch {}
  const persist = () => {
    try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch {}
  };

  const scrollDown = () => (log.scrollTop = log.scrollHeight);

  function bubble(from, html, { save = true } = {}) {
    const el = document.createElement('div');
    el.className = `msg msg--${from}`;
    if (from === 'user') el.textContent = html;
    else el.innerHTML = html;
    log.append(el);
    scrollDown();
    if (save) {
      history.push({ from, html });
      persist();
    }
    return el;
  }

  function renderBot({ html, actions = [] }, opts) {
    const acts = actions.length
      ? `<div class="msg__actions">${actions
          .map((a) => `<a href="${a.href}"${a.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${a.label} <svg class="icon" aria-hidden="true"><use href="#i-arrow-ur" /></svg></a>`)
          .join('')}</div>`
      : '';
    return bubble('bot', html + acts, opts);
  }

  function renderChips(list = quickReplies) {
    chips.innerHTML = list.map((q) => `<button class="chip" type="button">${q}</button>`).join('');
  }

  function ask(text) {
    const q = text.trim();
    if (!q || busy) return;
    busy = true;
    bubble('user', q);
    const typing = document.createElement('div');
    typing.className = 'msg msg--bot msg--typing';
    typing.setAttribute('aria-label', 'Dew is typing');
    typing.innerHTML = '<span></span><span></span><span></span>';
    log.append(typing);
    scrollDown();
    const answer = reply(q);
    const delay = Math.min(1300, 450 + answer.html.length * 2.2);
    setTimeout(() => {
      typing.remove();
      renderBot(answer);
      busy = false;
      renderChips(quickReplies.filter((c) => c.toLowerCase() !== q.toLowerCase()).slice(0, 5));
    }, delay);
  }

  // restore or greet
  if (history.length) history.forEach((m) => bubble(m.from, m.html, { save: false }));
  else {
    renderBot({ html: 'Hi, I’m <strong>Dew</strong>, Oiyo’s host. Ask me anything: hours, the menu, dietary needs, booking a table or our workshops.' });
  }
  renderChips();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ask(input.value);
    input.value = '';
  });
  chips.addEventListener('click', (e) => {
    const c = e.target.closest('.chip');
    if (c) ask(c.textContent);
  });
  // keep wheel/touch scrolling inside the log instead of the page
  log.setAttribute('data-lenis-prevent', '');

  const small = () => innerWidth <= 520;
  function open(question) {
    if (!isOpen) {
      isOpen = true;
      host.classList.add('is-open', 'was-opened');
      panel.setAttribute('aria-hidden', 'false');
      host.querySelectorAll('[data-chat-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
      host.querySelector('[data-chat-teaser]').hidden = true;
      host.dispatchEvent(new CustomEvent('chat:open'));
      if (small()) {
        lenis?.stop();
        document.body.style.overflow = 'hidden';
      }
      setTimeout(() => {
        scrollDown();
        if (!small()) input.focus();
      }, 250);
    }
    if (question) setTimeout(() => ask(question), 300);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    host.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    host.querySelectorAll('[data-chat-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    lenis?.start();
    document.body.style.overflow = '';
    launcher.focus();
  }
  addEventListener('keydown', (e) => e.key === 'Escape' && isOpen && close());

  return { open, close, toggle: () => (isOpen ? close() : open()) };
}
