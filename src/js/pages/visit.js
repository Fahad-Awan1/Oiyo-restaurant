import '../main.js';
import { $, $$, scrollToTarget, toast } from '../core.js';
import { hours, contact } from '../../data/menu.js';
import { cafeNow, fmtHour } from '../hours.js';
import { heroParticles } from '../three/gate.js';
import { enhanceSelects } from '../customSelect.js';

heroParticles($('[data-particles]'), { beans: 6, leaves: 14 });

/* ----- reservation flow --------------------------------------------------
   Front-end only: the request is held in this page and confirmed visually.
   To take real bookings, POST `booking` to your backend or a service such as
   OpenTable/Resy/Formspree inside submitDetails(). */
const steps = $$('.reserve__step');
const f1 = $('form[data-step="1"]');
const f2 = $('form[data-step="2"]');
const dateEl = $('#r-date');
const timeEl = $('#r-time');
const guestsEl = $('#r-guests');
const occEl = $('#r-occasion');
let booking = null;

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function show(n) {
  steps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === String(n)));
  const el = steps[n - 1];
  (el.querySelector('input:not([type="hidden"]), [tabindex="-1"]') || el)?.focus({ preventScroll: true });
}

function fillTimes() {
  const date = dateEl.value ? parseDate(dateEl.value) : new Date();
  const [open, close] = hours[date.getDay()];
  const now = cafeNow();
  const isToday = dateEl.value === isoDate(new Date());
  const prev = timeEl.value;
  const slots = [];
  for (let h = open; h <= close - 1; h += 0.5) {
    if (isToday && h <= now.hour + 0.5) continue;
    slots.push(h);
  }
  timeEl.innerHTML = slots.length
    ? slots.map((h) => `<option value="${h}">${fmtHour(h)}</option>`).join('')
    : '<option value="">No times left today</option>';
  if (slots.includes(Number(prev))) timeEl.value = prev;
  else if (slots.includes(10)) timeEl.value = '10';
}

function initDate() {
  const today = new Date();
  dateEl.min = isoDate(today);
  const max = new Date(today);
  max.setDate(max.getDate() + 90);
  dateEl.max = isoDate(max);
  // if there's no time left today, default to tomorrow
  const now = cafeNow();
  const start = new Date(today);
  if (now.hour >= hours[today.getDay()][1] - 1.5) start.setDate(start.getDate() + 1);
  dateEl.value = isoDate(start);
  fillTimes();
}

function setError(input, msg) {
  const field = input.closest('.field');
  field.classList.toggle('is-invalid', !!msg);
  field.querySelector('.field__error')?.remove();
  input.setAttribute('aria-invalid', String(!!msg));
  if (msg) {
    const e = document.createElement('span');
    e.className = 'field__error';
    e.textContent = msg;
    field.append(e);
  }
  return !msg;
}

function summary() {
  const d = parseDate(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const g = booking.guests === '9' ? '9+ guests' : `${booking.guests} guest${booking.guests === '1' ? '' : 's'}`;
  return `${d} · ${fmtHour(Number(booking.time))} · ${g}${booking.occasion ? ` · ${booking.occasion}` : ''}`;
}

dateEl.addEventListener('change', fillTimes);
guestsEl.addEventListener('change', () => ($('[data-big-party]').hidden = guestsEl.value !== '9'));

f1.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = setError(dateEl, !dateEl.value || dateEl.value < dateEl.min ? 'Please choose a date from today on' : '');
  ok = setError(timeEl, !timeEl.value ? 'Please pick another day' : '') && ok;
  if (!ok) return;
  booking = { date: dateEl.value, time: timeEl.value, guests: guestsEl.value, occasion: occEl.value };
  $('[data-summary]').textContent = summary();
  show(2);
});

f2.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#r-name');
  const phone = $('#r-phone');
  const email = $('#r-email');
  let ok = setError(name, name.value.trim().length < 2 ? 'Please tell us your name' : '');
  ok = setError(phone, !/^[0-9+()\-\s]{7,}$/.test(phone.value.trim()) ? 'A phone number helps us reach you' : '') && ok;
  ok = setError(email, email.value && !email.checkValidity() ? 'That email looks incomplete' : '') && ok;
  if (!ok) return;
  Object.assign(booking, { name: name.value.trim(), phone: phone.value.trim(), email: email.value.trim(), notes: $('#r-notes').value.trim() });
  submitDetails();
});

function submitDetails() {
  booking.ref = `OIYO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  $('[data-ref]').textContent = booking.ref;
  $('[data-confirm-text]').textContent = `Thank you, ${booking.name.split(' ')[0]}. ${summary()}. ${
    booking.guests === '9' ? 'We’ll call you within a day to plan your gathering.' : 'We’ll text a confirmation shortly. See you soon.'
  }`;
  show(3);
  toast('<svg class="icon" aria-hidden="true"><use href="#i-check" /></svg> Booking request sent');
}

$('[data-back]').addEventListener('click', () => show(1));
$('[data-again]').addEventListener('click', () => {
  f2.reset();
  show(1);
});

// Downloadable calendar invite
$('[data-ics]').addEventListener('click', () => {
  if (!booking) return;
  const start = parseDate(booking.date);
  const h = Number(booking.time);
  start.setHours(Math.floor(h), (h % 1) * 60);
  const end = new Date(start.getTime() + 90 * 60000);
  const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Oiyo//Reservations//EN', 'BEGIN:VEVENT',
    `UID:${booking.ref}@oiyo.cafe`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=America/Los_Angeles:${stamp(start)}`, `DTEND;TZID=America/Los_Angeles:${stamp(end)}`,
    `SUMMARY:Table at Oiyo (${booking.guests} guests)`, `LOCATION:${contact.address}`,
    `DESCRIPTION:Reference ${booking.ref}. Take a breath. Sip slowly.`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'oiyo-reservation.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ?occasion=Workshop or buttons with data-occasion pre-select the occasion
function setOccasion(v) {
  const opt = [...occEl.options].find((o) => o.value === v || o.text === v);
  if (!opt) return;
  occEl.value = opt.value || opt.text;
  occEl.dispatchEvent(new Event('change', { bubbles: true }));
}
const qOcc = new URLSearchParams(location.search).get('occasion');
if (qOcc) setOccasion(qOcc);
$$('[data-occasion]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    setOccasion(a.dataset.occasion);
    show(1);
    scrollToTarget('#reserve');
  })
);

$('[data-focus-newsletter]')?.addEventListener('click', (e) => {
  e.preventDefault();
  const input = $('#nl-email');
  scrollToTarget(input, { offset: -200 });
  setTimeout(() => input.focus({ preventScroll: true }), 900);
});

enhanceSelects();
initDate();
