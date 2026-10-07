// Dew's knowledge: hand-written intents matched by keywords (with typo
// tolerance in chatbot.js). Answers may be strings or functions returning
// { html, actions } so they can use live data (hours, prices).
import { menu, seasonalTray, hours, contact } from '../../data/menu.js';
import { getStatus, weekTable, fmtHour } from '../hours.js';

const money = (n) => `$${n.toFixed(2)}`;
const link = (href, label) => ({ href, label });
const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const byTag = (t) => menu.filter((m) => m.tags.includes(t));

export const quickReplies = ['Are you open now?', 'Book a table', 'What’s on the menu?', 'Vegan options', 'Where are you?', 'Workshops'];

export const intents = [
  {
    id: 'greeting',
    keys: ['hi', 'hello', 'hey', 'hiya', 'morning', 'evening', 'yo', 'salaam', 'hola'],
    answer: () => ({ html: `Hello, and welcome to Oiyo. ${getStatus().text}. What can I help you with: the menu, a table, or directions?` }),
  },
  {
    id: 'thanks',
    keys: ['thanks', 'thank', 'thx', 'cheers', 'appreciate', 'great', 'perfect', 'awesome'],
    answer: 'You’re very welcome. Take a breath, sip slowly. I’m here if you need anything else.',
  },
  {
    id: 'bye',
    keys: ['bye', 'goodbye', 'later', 'cya'],
    answer: 'Until next time. The kettle will be on.',
  },
  {
    id: 'open-now',
    keys: ['open now', 'are you open', 'still open', 'closed', 'close today', 'closing', 'right now', 'open today'],
    weight: 2,
    answer: () => {
      const s = getStatus();
      return { html: `${s.text}.<br>We’re open daily: weekdays 7 AM – 6 PM, Saturday 8 AM – 7 PM, Sunday 8 AM – 5 PM.`, actions: [link('/visit.html#hours', 'See all hours')] };
    },
  },
  {
    id: 'hours',
    keys: ['hours', 'timing', 'timings', 'time', 'when', 'open', 'opening', 'schedule', 'weekend', 'sunday', 'saturday', 'monday', 'holiday'],
    answer: () => ({
      html: `Our hours:${list(weekTable().map((d) => `${d.day}: ${fmtHour(d.open)} – ${fmtHour(d.close)}`))}We close on a few holidays to rest and recharge. Those are posted in the Journal.`,
      actions: [link('/visit.html#hours', 'Visit page')],
    }),
  },
  {
    id: 'location',
    keys: ['where', 'address', 'location', 'located', 'directions', 'find you', 'map', 'get there', 'portland', 'near'],
    answer: { html: `We’re at <strong>${contact.address}</strong>, tucked into a garden courtyard off Willow Lane, five minutes from Laurelhurst Park.`, actions: [link(contact.maps, 'Get directions'), link('/visit.html#find-us', 'See the map')] },
  },
  {
    id: 'parking',
    keys: ['parking', 'park', 'car', 'bike', 'bicycle', 'bus', 'transit', 'tram'],
    answer: 'There’s free two-hour street parking on Willow Lane and a bike rack right by the door. The #15 bus stops one block away.',
  },
  {
    id: 'reserve',
    keys: ['book', 'booking', 'reserve', 'reservation', 'table', 'seat', 'seats', 'party', 'people', 'guests', 'group'],
    weight: 1.5,
    answer: (q) => {
      const n = q.match(/\b(\d{1,2})\b/);
      const party = n ? Number(n[1]) : null;
      const big = party && party > 10;
      return {
        html: big
          ? `For a party of ${party}, we’d love to host you as a <strong>private gathering</strong>. Our garden room seats up to 40. Send us a note and we’ll shape the evening with you.`
          : `${party ? `A table for ${party}? Lovely. ` : ''}You can reserve in under a minute on our Visit page: choose a date, time and party size. There are no fees, and changes are easy. Walk-ins are always welcome too.`,
        actions: big ? [link('mailto:safersolutionllc@gmail.com?subject=Private%20gathering', 'Email us'), link('/visit.html#gatherings', 'Private gatherings')] : [link('/visit.html#reserve', 'Reserve a table')],
      };
    },
  },
  {
    id: 'cancel',
    keys: ['cancel', 'change booking', 'reschedule', 'modify', 'late'],
    answer: { html: `No problem at all. Call us on <a href="tel:${contact.tel}">${contact.phone}</a> or reply to your confirmation email. We hold tables for 15 minutes.`, actions: [] },
  },
  {
    id: 'menu',
    keys: ['menu', 'food', 'eat', 'drinks', 'serve', 'offer', 'options', 'dishes', 'breakfast', 'brunch', 'lunch'],
    answer: () => ({
      html: `We pour coffee and ceremonial matcha, and we bake slowly every morning. A few favourites:${list(menu.filter((m) => m.signature).map((m) => `${m.name} · ${money(m.price)}`))}Breakfast is served all day.`,
      actions: [link('/menu.html', 'Full menu')],
    }),
  },
  {
    id: 'coffee',
    keys: ['coffee', 'espresso', 'latte', 'cappuccino', 'cortado', 'pour over', 'cold brew', 'beans', 'roast', 'decaf', 'chai', 'cocoa', 'mocha', 'hot chocolate'],
    answer: () => ({
      html: `Our coffee is roasted in small batches just across the river.${list(menu.filter((m) => m.cat === 'coffee').map((m) => `${m.name} · ${money(m.price)}`))}Decaf (Swiss Water) is available for any espresso drink.`,
      actions: [link('/menu.html#coffee', 'Coffee menu')],
    }),
  },
  {
    id: 'matcha',
    keys: ['matcha', 'tea', 'green tea', 'usucha', 'whisk'],
    answer: () => ({
      html: `We whisk first-harvest Uji matcha to order:${list(menu.filter((m) => m.cat === 'matcha').map((m) => `${m.name} · ${money(m.price)}`))}`,
      actions: [link('/menu.html#matcha', 'Matcha menu'), link('/journal.html#how-we-whisk', 'How we whisk')],
    }),
  },
  {
    id: 'pastry',
    keys: ['pastry', 'pastries', 'cake', 'croissant', 'cookie', 'sweet', 'dessert', 'bake', 'bakery', 'bread', 'sourdough'],
    answer: () => ({
      html: `Baked every morning, in small batches:${list(menu.filter((m) => m.cat === 'pastries').map((m) => `${m.name} · ${money(m.price)}`))}Loaves usually sell out by noon. Ask us to set one aside.`,
      actions: [link('/menu.html#pastries', 'Pastries')],
    }),
  },
  {
    id: 'price',
    keys: ['price', 'cost', 'how much', 'expensive', 'cheap'],
    answer: (q) => {
      const hit = findItem(q);
      if (hit) return { html: `The <strong>${hit.name}</strong> is ${money(hit.price)}. ${hit.desc}`, actions: [link(`/menu.html#${hit.cat}`, 'See it on the menu')] };
      return { html: 'Coffees run $4.75–$6.00, matcha $6.00–$6.50, pastries $3.25–$6.50 and breakfast plates $12.50–$14.00. Which item were you curious about?' };
    },
  },
  {
    id: 'vegan',
    keys: ['vegan', 'plant', 'plant based', 'dairy free', 'dairy', 'lactose', 'oat milk', 'milk alternative'],
    answer: () => ({
      html: `Plenty! Oat milk is our default alternative at no extra charge. Fully vegan:${list(byTag('v').map((m) => m.name))}`,
      actions: [link('/menu.html?diet=v', 'Show vegan items')],
    }),
  },
  {
    id: 'gluten',
    keys: ['gluten', 'gluten free', 'celiac', 'coeliac', 'gf', 'wheat'],
    answer: () => ({
      html: `Gluten-free picks:${list(byTag('gf').map((m) => m.name))}Our kitchen handles flour, so we can’t promise zero cross-contact for severe coeliac allergies.`,
      actions: [link('/menu.html?diet=gf', 'Show gluten-free')],
    }),
  },
  {
    id: 'allergy',
    keys: ['allergy', 'allergies', 'allergen', 'nut', 'nuts', 'peanut', 'pistachio', 'egg', 'soy', 'sesame'],
    answer: { html: 'Every item on the menu is labelled V, GF or NF. Nuts appear in a few pastries (pistachio, dukkah), so please tell the team about any allergy and we’ll guide you.', actions: [link('/menu.html#allergens', 'Allergen guide'), link('/menu.html?diet=nf', 'Nut-free items')] },
  },
  {
    id: 'seasonal',
    keys: ['seasonal', 'special', 'specials', 'new', 'season', 'autumn', 'fall', 'tray', 'tasting'],
    answer: () => ({ html: `This season: <strong>${seasonalTray.name}</strong> (${money(seasonalTray.price)}), ${seasonalTray.desc.toLowerCase()} New on the board: ${byTag('new').map((m) => m.name).join(', ')}.`, actions: [link('/menu.html#seasonal', 'Seasonal tray')] }),
  },
  {
    id: 'wifi',
    keys: ['wifi', 'wi fi', 'internet', 'laptop', 'work', 'remote', 'study', 'plug', 'socket', 'charging'],
    answer: 'Yes, free Wi-Fi (the password is on your receipt). The window bar has sockets. To keep the room calm, we ask laptop guests to give up their seat on busy weekend mornings.',
  },
  {
    id: 'pets',
    keys: ['dog', 'dogs', 'pet', 'pets', 'cat', 'puppy'],
    answer: 'Well-behaved dogs are welcome on the terrace, and we keep a water bowl (and the odd biscuit) by the door.',
  },
  {
    id: 'kids',
    keys: ['kids', 'children', 'child', 'baby', 'stroller', 'pram', 'high chair', 'family'],
    answer: 'Families are very welcome. We have high chairs, a changing table and a small babyccino for little ones.',
  },
  {
    id: 'accessibility',
    keys: ['wheelchair', 'accessible', 'accessibility', 'step free', 'ramp', 'disabled'],
    answer: 'The café and garden room are step-free, with an accessible restroom. Let us know when booking and we’ll save a spacious table.',
  },
  {
    id: 'private',
    keys: ['private', 'event', 'events', 'birthday', 'party', 'celebration', 'wedding', 'corporate', 'meeting', 'hire', 'buyout'],
    answer: { html: 'We host private gatherings in our garden room for up to 40 guests: birthdays, intimate celebrations and team mornings. Tell us your date and we’ll shape a menu together.', actions: [link('/visit.html#gatherings', 'Private gatherings'), link('mailto:safersolutionllc@gmail.com?subject=Private%20gathering', 'Email us')] },
  },
  {
    id: 'chefs-table',
    keys: ['chef', 'chefs table', 'tasting menu', 'dinner', 'supper', 'friday', 'evening'],
    answer: { html: 'The <strong>Chef’s Table</strong> is an intimate, multi-course experience cooked in real time, with eight seats on Friday and Saturday evenings. Garden Suppers on the terrace run every Friday through October.', actions: [link('/visit.html#gatherings', 'Learn more'), link('/visit.html#reserve', 'Reserve')] },
  },
  {
    id: 'workshops',
    keys: ['workshop', 'workshops', 'class', 'classes', 'course', 'learn', 'latte art', 'lesson', 'ceremony', 'barista'],
    answer: { html: `Our rituals, taught:${list(['Latte Art Saturdays · $45 · first Saturday monthly', 'Matcha Ceremony · $38 · Sunday mornings', 'Home Brewing 101 · $40 · Wednesday evenings'])}`, actions: [link('/rituals.html#workshops', 'Workshops')] },
  },
  {
    id: 'order',
    keys: ['order', 'takeaway', 'take away', 'to go', 'pickup', 'pick up', 'delivery', 'deliver', 'online'],
    answer: { html: `Tap <strong>+</strong> on anything in the menu to add it to your tray, then show it at the counter or call ahead on <a href="tel:${contact.tel}">${contact.phone}</a> and we’ll have it ready. We don’t deliver yet, because coffee is best fresh.`, actions: [link('/menu.html', 'Start a tray')] },
  },
  {
    id: 'gift',
    keys: ['gift', 'gift card', 'voucher', 'present'],
    answer: 'Gift cards are available at the counter in any amount, and they come with a hand-written note. Our Pour-Over Home Kit ($64) makes a lovely present too.',
  },
  {
    id: 'payment',
    keys: ['pay', 'payment', 'card', 'cash', 'apple pay', 'credit', 'tip'],
    answer: 'We accept all major cards, Apple Pay and Google Pay. Cash is welcome too.',
  },
  {
    id: 'contact',
    keys: ['contact', 'phone', 'call', 'email', 'number', 'reach', 'instagram', 'social'],
    answer: { html: `Call <a href="tel:${contact.tel}">${contact.phone}</a> or email <a href="mailto:${contact.email}">${contact.email}</a>. We’re @oiyo.cafe on Instagram.`, actions: [] },
  },
  {
    id: 'story',
    keys: ['story', 'about you', 'about oiyo', 'who owns', 'owner', 'founded', 'history', 'oiyo mean', 'your name', 'background'],
    answer: { html: 'Oiyo began in 2019 as a coffee cart and a sourdough starter. It’s now a garden café built around one idea: the best moments aren’t rushed. To us, the name sounds like the small, contented sigh after a first sip.', actions: [link('/story.html', 'Our story')] },
  },
  {
    id: 'jobs',
    keys: ['job', 'jobs', 'hiring', 'work for', 'career', 'apply', 'vacancy'],
    answer: { html: `We’re always happy to meet kind, curious people. Send a note about yourself to <a href="mailto:${contact.email}?subject=Joining%20the%20team">${contact.email}</a>.`, actions: [] },
  },
  {
    id: 'sustain',
    keys: ['sustainable', 'sustainability', 'ethical', 'organic', 'sourcing', 'sourced', 'farm', 'fair trade', 'compost', 'eco'],
    answer: { html: 'We buy direct from twelve partner farms, compost every coffee puck and use only reusable or home-compostable cups. Bring your own cup for 25¢ off.', actions: [link('/story.html', 'How we source')] },
  },
  {
    id: 'bot',
    keys: ['who are you', 'are you human', 'bot', 'robot', 'ai', 'dew'],
    answer: 'I’m Dew, Oiyo’s little digital host. I know our hours, menu, bookings and rituals. For anything else, the team is a call away.',
  },
];

const GENERIC = new Set(['coffee', 'matcha', 'latte', 'beans', 'cake', 'cookie', 'bread', 'loaf', 'with', 'house', 'single', 'origin']);

/** A specific dish named in the question (ignores generic words like “coffee”). */
export function findDish(q) {
  const s = q.toLowerCase();
  let best = null;
  let score = 0;
  for (const m of [...menu, seasonalTray]) {
    const words = m.name.toLowerCase().replace(/[^a-zà-ÿ\s]/g, '').split(/\s+/).filter((w) => w.length > 3 && !GENERIC.has(w));
    const hits = words.filter((w) => s.includes(w)).length;
    if (hits > score) {
      score = hits;
      best = m;
    }
  }
  return best;
}

/** Match a menu item mentioned in the question (used for price lookups). */
export function findItem(q) {
  const s = q.toLowerCase();
  let best = null;
  let score = 0;
  for (const m of [...menu, seasonalTray]) {
    const words = m.name.toLowerCase().replace(/[^a-zà-ÿ\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
    const hits = words.filter((w) => s.includes(w)).length;
    if (hits > score) {
      score = hits;
      best = m;
    }
  }
  return best;
}

export const fallback = () => ({
  html: `I’m not sure I caught that, but I’m still learning. I can help with <strong>hours</strong>, <strong>bookings</strong>, the <strong>menu and prices</strong>, <strong>dietary needs</strong>, <strong>events</strong> and <strong>directions</strong>. Or reach the team on <a href="tel:${contact.tel}">${contact.phone}</a>.`,
});

export { hours };
