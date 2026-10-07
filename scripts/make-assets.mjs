// Generates brand assets into /public: paper-grain noise, favicons,
// apple-touch icon and the Open Graph image. Run: node scripts/make-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';

const OUT = 'public';
const FOREST = '#2F3A24';
const CREAM = '#F3EFE6';
const DEW = '#A7B98D';

const mark = (color, sw = 1) => `
  <g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="20" stroke-width="${2.2 * sw}"/>
    <circle cx="24" cy="24" r="14.5" stroke-width="${1.1 * sw}" opacity=".7"/>
    <path d="M44 18.5c6.5-1 8.5 2.6 8.5 5.5s-2 6.5-8.5 5.5" stroke-width="${2.2 * sw}"/>
    <path d="M15.5 32.5C16.5 22 23.5 15.5 33 15.5c-.5 10-7.5 16.5-17.5 17z" stroke-width="${1.6 * sw}"/>
    <path d="M15.5 32.5C20.5 27 25.5 22 30.5 18" stroke-width="${1.1 * sw}"/>
  </g>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="${FOREST}"/>
  <g transform="translate(5 8)">${mark(DEW, 1.6)}</g>
</svg>`;
await fs.writeFile(`${OUT}/favicon.svg`, favicon);
await sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(`${OUT}/favicon-32.png`);
await sharp(Buffer.from(favicon.replace('rx="16"', 'rx="0"'))).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);
for (const s of [192, 512]) await sharp(Buffer.from(favicon)).resize(s, s).png().toFile(`${OUT}/icon-${s}.png`);

// Paper grain: soft monochrome noise, tiled by CSS
const N = 160;
const px = Buffer.alloc(N * N * 4);
for (let i = 0; i < N * N; i++) {
  const v = 120 + Math.floor(Math.random() * 110);
  px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
  px[i * 4 + 3] = Math.floor(Math.random() * 38);
}
await sharp(px, { raw: { width: N, height: N, channels: 4 } }).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/noise.png`);

// Open Graph card
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <path d="M760 0h440v630H700c-80-60-40-180-120-250S560 60 760 0z" fill="${FOREST}"/>
  <g transform="translate(820 170) scale(6)">${mark(DEW)}</g>
  <text x="90" y="250" font-family="Georgia, serif" font-size="110" letter-spacing="22" fill="${FOREST}">OIYO</text>
  <text x="92" y="330" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#5F6B3D">Coffee, sculpted by ritual.</text>
  <text x="92" y="520" font-family="Arial, sans-serif" font-size="24" letter-spacing="5" fill="#5F6B3D">GARDEN CAFÉ · PORTLAND</text>
</svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 82 }).toFile(`${OUT}/og-image.jpg`);
console.log('assets ok');
