import '../main.js';
import { gsap, $, $$, onReady, money, reducedMotion } from '../core.js';
import { canRender3D, whenNear } from '../three/gate.js';
import { addToTray } from '../tray.js';

const heroStage = $('[data-cup-anchor="hero"]');
const builderStage = $('[data-cup-anchor="builder"]');
const builderSection = $('#ritual-builder');

/* ----- drinks: shared by the hero chips and the Ritual Builder ----------- */
const BASE = {
  cappuccino: { label: 'Cappuccino', black: 'Espresso', price: 5.25, img: 'cappuccino' },
  matcha: { label: 'Matcha Latte', black: 'Usucha Matcha', price: 6.0, img: 'matcha' },
  chai: { label: 'Chai Latte', black: 'Masala Chai', price: 5.5, img: 'latte' },
  cocoa: { label: 'Hot Cocoa', black: 'Dark Cocoa', price: 5.75, img: 'cocoa-pour' },
};
const SWEET = { none: '', honey: ' with Wildflower Honey', maple: ' with Smoked Maple' };
const choice = { drink: 'cappuccino', milk: 'whole', sweet: 'none' };

function describe({ drink, milk, sweet }) {
  const b = BASE[drink];
  const name = (milk === 'none' ? b.black : `${milk === 'oat' ? 'Oat ' : ''}${b.label}`) + SWEET[sweet];
  const price = b.price + (sweet !== 'none' ? 0.5 : 0);
  return { name, price, img: b.img };
}

let cup = null;
let pending = null;

function apply(partial) {
  Object.assign(choice, partial);
  const d = describe(choice);
  const nameEl = $('[data-builder-name]');
  const priceEl = $('[data-builder-price]');
  if (nameEl) nameEl.textContent = d.name;
  if (priceEl) priceEl.textContent = money(d.price);
  // hero chips mirror the base drink
  $$('[data-drink]').forEach((c) => {
    const on = c.dataset.drink === choice.drink;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  const radio = $(`input[name="drink"][value="${choice.drink}"]`);
  if (radio) radio.checked = true;
  if (cup) cup.setDrink({ ...choice });
  else {
    pending = { ...choice };
    // no WebGL: swap the poster photos instead
    $$('.stage__poster', heroStage?.parentElement).forEach((img) => {
      img.src = `/img/${BASE[choice.drink].img}-sm.webp`;
      img.srcset = `/img/${BASE[choice.drink].img}-sm.webp 640w, /img/${BASE[choice.drink].img}-md.webp 960w, /img/${BASE[choice.drink].img}-lg.webp 1400w`;
    });
  }
}

$$('[data-drink]').forEach((c) => c.addEventListener('click', () => apply({ drink: c.dataset.drink })));
$$('.builder__options input').forEach((input) => input.addEventListener('change', () => apply({ [input.name]: input.value })));
$('[data-builder-add]')?.addEventListener('click', () => {
  const d = describe(choice);
  addToTray({
    id: `ritual-${choice.drink}-${choice.milk}-${choice.sweet}`,
    name: d.name,
    price: d.price,
    img: d.img,
    meta: 'Built in the Ritual Builder',
  }, { from: builderStage });
  cup?.nudge(Math.PI * 2);
});

/* ----- 3D cup ------------------------------------------------------------ */
if (canRender3D() && heroStage) {
  const startCup = () =>
    whenNear(heroStage, () =>
      import('../three/heroCup.js').then(async ({ mountCup }) => {
        cup = await mountCup({ anchors: [heroStage, builderStage], transitTrigger: builderSection });
        if (pending) cup.setDrink(pending);
        onReady(() => cup.intro());
      })
    );
  if (innerWidth >= 768) startCup();
  else {
    // Phones: the photo poster paints first; the 3D cup pours itself in on the
    // first touch or scroll, keeping the initial load light.
    const events = ['scroll', 'touchstart', 'pointerdown', 'keydown'];
    const once = () => {
      events.forEach((e) => removeEventListener(e, once));
      startCup();
    };
    events.forEach((e) => addEventListener(e, once, { passive: true }));
  }
} else {
  $$('.builder__hint').forEach((el) => (el.hidden = true));
}

/* ----- hero entrance ---------------------------------------------------- */
onReady(() => {
  if (reducedMotion) return;
  gsap.from('.hero__backdrop', { scale: 0.85, opacity: 0, duration: 1.6, ease: 'expo.out' });
  gsap.from('.hero__badge', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)', delay: 0.6 });
  gsap.from('.hero__deco', { scale: 0.6, opacity: 0, duration: 2, ease: 'expo.out', stagger: 0.15 });
  // gentle parallax of the backdrop while leaving the hero
  gsap.to('.hero__backdrop', { yPercent: 8, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
});
