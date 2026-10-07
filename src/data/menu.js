// Single source of truth for the menu. Rendered into HTML at build time
// (see src/data/render.js + vite.config.js) and read by the chatbot.
// tags: v = vegan, gf = gluten-free, nf = nut-free, new, seasonal

export const categories = [
  { id: 'coffee', label: 'Coffee', icon: 'i-bean' },
  { id: 'matcha', label: 'Matcha', icon: 'i-leaf' },
  { id: 'pastries', label: 'Pastries', icon: 'i-flower' },
  { id: 'breakfast', label: 'Breakfast', icon: 'i-sprig' },
  { id: 'pantry', label: 'Pantry', icon: 'i-wheat' },
];

export const menu = [
  // Coffee
  { id: 'dew-cappuccino', cat: 'coffee', name: 'Dew Cappuccino', desc: 'Silky microfoam, bright and balanced.', price: 5.25, img: 'cappuccino', icon: 'i-bean', tags: ['gf', 'nf'], signature: true },
  { id: 'velvet-oat-latte', cat: 'coffee', name: 'Velvet Oat Latte', desc: 'House oat milk, double ristretto, a slow rosetta.', price: 5.5, img: 'latte', icon: 'i-bean', tags: ['v', 'nf'] },
  { id: 'amber-cold-brew', cat: 'coffee', name: 'Amber Cold Brew', desc: 'Slow-steeped for eighteen hours, for clarity and depth.', price: 5.5, img: 'cold-brew', icon: 'i-drop', tags: ['v', 'gf', 'nf'], signature: true },
  { id: 'honey-cortado', cat: 'coffee', name: 'Honey Cortado', desc: 'Equal parts espresso and warm milk, wildflower honey.', price: 4.75, img: 'two-lattes', icon: 'i-bean', tags: ['gf', 'nf'] },
  { id: 'slow-pour-over', cat: 'coffee', name: 'Slow Pour-Over', desc: 'Single origin, poured by hand in four patient stages.', price: 6.0, img: 'pour-over', icon: 'i-dripper', tags: ['v', 'gf', 'nf'] },
  { id: 'maple-mocha', cat: 'coffee', name: 'Smoked Maple Mocha', desc: 'Dark cocoa, maple smoked over applewood, espresso.', price: 5.75, img: 'cocoa-pour', icon: 'i-flame', tags: ['gf', 'nf', 'seasonal'] },

  // Matcha
  { id: 'stone-matcha', cat: 'matcha', name: 'Stone Matcha', desc: 'Ceremonial grade matcha with oat creamer.', price: 6.0, img: 'matcha', icon: 'i-leaf', tags: ['v', 'gf', 'nf'], signature: true },
  { id: 'ceremonial-usucha', cat: 'matcha', name: 'Ceremonial Usucha', desc: 'Whisked to order in a stoneware bowl, served pure.', price: 6.5, img: 'matcha-ritual', icon: 'i-leaf', tags: ['v', 'gf', 'nf'] },
  { id: 'matcha-cloud', cat: 'matcha', name: 'Vanilla Matcha Cloud', desc: 'Matcha under a cloud of Tahitian vanilla foam.', price: 6.25, img: 'matcha-laptop', icon: 'i-leaf', tags: ['gf', 'nf', 'new'] },

  // Pastries
  { id: 'pistachio-roll', cat: 'pastries', name: 'Pistachio Crème Roll', desc: 'Buttery layers, pistachio crème, a hint of cardamom.', price: 5.75, img: 'croissant', icon: 'i-flower', tags: [], signature: true },
  { id: 'cinnamon-knot', cat: 'pastries', name: 'Cinnamon Knot', desc: 'Warm spice, crisp edges, soft center.', price: 4.5, img: 'cinnamon-knot', icon: 'i-flower', tags: ['nf'] },
  { id: 'garden-tartlets', cat: 'pastries', name: 'Garden Fruit Tartlets', desc: 'Vanilla custard, market berries, edible flowers.', price: 4.25, img: 'fruit-tarts', icon: 'i-flower', tags: ['nf', 'seasonal'] },
  { id: 'raspberry-cloud', cat: 'pastries', name: 'Raspberry Cloud Cake', desc: 'Sponge, whipped mascarpone, raspberries.', price: 6.5, img: 'berry-cake', icon: 'i-flower', tags: ['nf'] },
  { id: 'brown-butter-cookie', cat: 'pastries', name: 'Brown Butter Cookie', desc: 'Sea salt, dark chocolate, crisp edges.', price: 3.25, img: 'cookies', icon: 'i-flower', tags: [] },
  { id: 'honey-pie', cat: 'pastries', name: 'Burnt Honey Cream Pie', desc: 'Toasted meringue, honey custard, oat crust.', price: 6.0, img: 'tart', icon: 'i-flower', tags: ['nf', 'new'] },

  // Breakfast
  { id: 'brioche-toast', cat: 'breakfast', name: 'Brioche French Toast', desc: 'Banana, blueberries, maple and cultured cream.', price: 13.5, img: 'french-toast', icon: 'i-sprig', tags: ['nf'] },
  { id: 'avocado-bowl', cat: 'breakfast', name: 'Avocado Garden Bowl', desc: 'Soft egg, greens, radish, seeded dukkah.', price: 14.0, img: 'avo-bowl', icon: 'i-sprig', tags: ['gf'] },
  { id: 'rainbow-bowl', cat: 'breakfast', name: 'Rainbow Grain Bowl', desc: 'Ancient grains, roast squash, tahini, herbs.', price: 13.0, img: 'garden-bowl', icon: 'i-sprig', tags: ['v', 'nf'] },
  { id: 'egg-greens', cat: 'breakfast', name: 'Soft Egg & Greens', desc: 'Jammy egg, wild greens, chili crisp, sourdough.', price: 12.5, img: 'egg-plate', icon: 'i-sprig', tags: ['nf'] },

  // Pantry
  { id: 'house-blend', cat: 'pantry', name: 'House Blend Beans · 250g', desc: 'Cocoa, stone fruit, a long caramel finish.', price: 18.0, img: 'coffee-bag', icon: 'i-bean', tags: ['v', 'gf', 'nf'] },
  { id: 'single-origin', cat: 'pantry', name: 'Guji Single Origin · 250g', desc: 'Ethiopian, washed. Jasmine and bergamot.', price: 21.0, img: 'beans', icon: 'i-bean', tags: ['v', 'gf', 'nf'] },
  { id: 'pour-over-kit', cat: 'pantry', name: 'Pour-Over Home Kit', desc: 'Dripper, filters, our blend, a ritual card.', price: 64.0, img: 'brew-kit', icon: 'i-dripper', tags: ['new'] },
  { id: 'country-sourdough', cat: 'pantry', name: 'Country Sourdough', desc: 'Forty-eight hour ferment, blistered crust.', price: 9.0, img: 'sourdough', icon: 'i-wheat', tags: ['v', 'nf'] },
  { id: 'seeded-rye', cat: 'pantry', name: 'Seeded Rye Loaf', desc: 'Dark rye, sunflower, flax and a little molasses.', price: 8.5, img: 'rye-loaf', icon: 'i-wheat', tags: ['v', 'nf'] },
];

export const seasonalTray = {
  id: 'seasonal-tray',
  name: 'A Tasting of the Season',
  desc: 'A curated selection of sweet and savory favorites, crafted to share and savor.',
  price: 28.0,
  img: 'chef-plate',
};

export const tagLabels = { v: 'Vegan', gf: 'Gluten-free', nf: 'Nut-free', new: 'New', seasonal: 'Seasonal' };

export const hours = {
  // 0 = Sunday … 6 = Saturday, [open, close] in 24h decimal hours
  0: [8, 17],
  1: [7, 18],
  2: [7, 18],
  3: [7, 18],
  4: [7, 18],
  5: [7, 18],
  6: [8, 19],
};

export const contact = {
  address: '24 Willow Lane, Portland, OR 97214',
  phone: '+1 713 364-5155',
  tel: '+17133645155',
  email: 'safersolutionllc@gmail.com',
  maps: 'https://www.google.com/maps/search/?api=1&query=24+Willow+Lane+Portland+OR+97214',
};
