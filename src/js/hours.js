// Live opening status + time-of-day greeting, computed in the café's timezone.
import { hours } from '../data/menu.js';
import { $$ } from './core.js';

const TZ = 'America/Los_Angeles';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const fmtHour = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${((hh + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${ampm}`;
};

/** Current day index and decimal hour in the café's local time. */
export function cafeNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const hour = (Number(get('hour')) % 24) + Number(get('minute')) / 60;
  return { day, hour };
}

export function getStatus(date) {
  const { day, hour } = cafeNow(date);
  const [open, close] = hours[day];
  if (hour >= open && hour < close) {
    const left = close - hour;
    return { state: left <= 1 ? 'soon' : 'open', text: left <= 1 ? `Closing soon · until ${fmtHour(close)}` : `Open now · until ${fmtHour(close)}`, day, hour };
  }
  // find next opening
  let nd = hour < open ? day : (day + 1) % 7;
  const label = nd === day ? 'today' : nd === (day + 1) % 7 ? 'tomorrow' : DAYS[nd];
  return { state: 'closed', text: `Closed · opens ${label} at ${fmtHour(hours[nd][0])}`, day, hour };
}

export function greeting(date) {
  const { hour } = cafeNow(date);
  if (hour < 5) return 'Up late? We’ll be brewing soon';
  if (hour < 11) return 'Good morning, slow down with us';
  if (hour < 14) return 'Good afternoon, a seat is waiting';
  if (hour < 18) return 'Golden hour, the kettle is on';
  return 'Good evening, rest and recharge';
}

export function weekTable() {
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: DAYS[d], d, open: hours[d][0], close: hours[d][1] }));
}

export function initHours() {
  const paint = () => {
    const s = getStatus();
    $$('[data-open-status]').forEach((el) => {
      el.dataset.openState = s.state;
      const t = el.querySelector('[data-open-text]');
      if (t) t.textContent = s.text;
    });
    $$('[data-greeting]').forEach((el) => (el.textContent = greeting()));
    $$('[data-today-row]').forEach((el) => el.classList.toggle('is-today', Number(el.dataset.todayRow) === s.day));
  };
  paint();
  setInterval(paint, 60_000);
}
