// Downloads the curated Unsplash photos and converts them to optimised WebP
// at three widths (sm/md/lg). Re-run with `npm run images`. Replace files in
// public/img with real photography at any time — keep the same names.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('public/img');
const PHOTOS = {
  cappuccino: '1509042239860-f550ce710b93',
  latte: '1572442388796-11668a67e53d',
  'latte-pour': '1541167760496-1628856ab772',
  matcha: '1515823064-d6e0c04616a7',
  'matcha-laptop': '1536256263959-770b48d82b0a',
  'matcha-ritual': '1582793988951-9aed5509eb97',
  'cold-brew': '1517701604599-bb29b565090c',
  'iced-amber': '1461023058943-07fcbe16d735',
  croissant: '1555507036-ab1f4038808a',
  'cinnamon-knot': '1509365465985-25d11c17e812',
  tart: '1519915028121-7d3463d20b13',
  'berry-cake': '1565958011703-44f9829ba187',
  'fruit-tarts': '1495147466023-ac5c588e2e94',
  cookies: '1558961363-fa8fdf82db35',
  'french-toast': '1484723091739-30a097e8f929',
  'avo-bowl': '1490645935967-10de6ba17061',
  'garden-bowl': '1512621776951-a57141f2eefd',
  'egg-plate': '1515003197210-e0cd71810b5f',
  sourdough: '1509440159596-0249088772ff',
  'rye-loaf': '1549931319-a545dcf3bc73',
  'coffee-bag': '1559056199-641a0ac8b55e',
  'brew-kit': '1611854779393-1b2da9d400fe',
  beans: '1447933601403-0c6688de566e',
  grounds: '1511920170033-f8396924c348',
  'pour-over': '1442512595331-e89e73853f31',
  'cup-leaves': '1494314671902-399b18174975',
  'sun-cup': '1559496417-e7f25cb247f3',
  'cocoa-pour': '1542990253-0d0f5be5f0ed',
  'two-lattes': '1507133750040-4a8f57021571',
  'coffee-board': '1497935586351-b67a49e012bf',
  tasting: '1498804103079-a6351b050096',
  interior: '1600093463592-8e36ae95ef56',
  'interior-plants': '1554118811-1e0d58224f24',
  'interior-wide': '1521017432531-fbd92d768814',
  terrace: '1559925393-8be0ec4767c8',
  'window-seat': '1534040385115-33dcb3acba5b',
  'dinner-table': '1414235077428-338989a2e8c0',
  kitchen: '1428515613728-6b4607e44363',
  'chef-plate': '1504754524776-8f4f37790ca0',
  'bar-counter': '1453614512568-c4024d13c247',
  'cup-ring': '1485808191679-5f86510681a2',
  cheers: '1495474472287-4d71bcdd2085',
};
const SIZES = { sm: 640, md: 960, lg: 1400 };

await fs.mkdir(OUT, { recursive: true });
for (const [name, id] of Object.entries(PHOTOS)) {
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=1600&q=85&fm=jpg`);
  if (!res.ok) { console.warn('skip', name, res.status); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  for (const [suffix, width] of Object.entries(SIZES)) {
    await sharp(buf)
      .resize({ width, withoutEnlargement: true })
      .modulate({ saturation: 0.9 }) // soften toward the earthy palette
      .webp({ quality: { sm: 68, md: 66, lg: 64 }[suffix], effort: 6 })
      .toFile(path.join(OUT, `${name}-${suffix}.webp`));
  }
  console.log('ok', name);
}
