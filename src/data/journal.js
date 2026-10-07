// Journal entries. Rendered at build time into journal.html (grid + article
// templates) and the home page preview.

export const journalCats = [
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'rituals', label: 'Rituals' },
  { id: 'events', label: 'Events' },
  { id: 'recipes', label: 'Recipes' },
];

export const posts = [
  {
    id: 'autumn-menu',
    cat: 'seasonal',
    title: 'The Autumn Menu Has Arrived',
    date: '2026-09-22',
    read: 4,
    img: 'tasting',
    excerpt: 'Roast squash, smoked maple and the first pears of the year. A slower, warmer table for the months ahead.',
    body: [
      'Every autumn we clear the chalkboard and start again. Not because the summer menu was wrong, but because the market changes, and we would rather follow it than fight it.',
      'This season leans warm: a Smoked Maple Mocha with maple we smoke over applewood ourselves, a Rainbow Grain Bowl built around roast squash from Hollow Creek Farm, and a Burnt Honey Cream Pie that has already caused one small argument in the kitchen.',
      'The Chef’s Seasonal Tray returns too. It is our favourite way to taste the menu: a little of everything, meant to be shared slowly.',
    ],
  },
  {
    id: 'how-we-whisk',
    cat: 'rituals',
    title: 'How We Whisk: Notes on Ceremonial Matcha',
    date: '2026-09-08',
    read: 6,
    img: 'matcha-ritual',
    excerpt: 'Seventy-five degrees, eighty strokes, one bamboo chasen. The quiet craft behind our Stone Matcha.',
    body: [
      'Matcha is unforgiving in the best way. Water too hot and it turns bitter; too few strokes and it sits flat and grassy in the bowl.',
      'We sift two grams of first-harvest Uji matcha, add 70ml of water at 75°C, and whisk in a quick “M” motion until a fine, even foam forms. It takes about twenty seconds. We have timed it more often than we would like to admit.',
      'At home, you need less equipment than you think: a fine sieve, a bowl with room to move, and the patience to stop scrolling for half a minute.',
    ],
  },
  {
    id: 'morning-with-roaster',
    cat: 'rituals',
    title: 'A Morning with Our Roaster',
    date: '2026-08-19',
    read: 5,
    img: 'beans',
    excerpt: 'We spent a dawn shift at the roastery, learning how small batches bring out a bean’s truest character.',
    body: [
      'Our beans are roasted twelve kilos at a time, three mornings a week, just across the river. Small batches mean every roast can be tasted, adjusted and tasted again.',
      'We roast a little lighter than most, aiming for sweetness and clarity over smoke. The House Blend should taste like cocoa and stone fruit, not like the roaster.',
    ],
  },
  {
    id: 'latte-art-saturdays',
    cat: 'events',
    title: 'Latte Art Saturdays Return',
    date: '2026-08-02',
    read: 3,
    img: 'cheers',
    excerpt: 'Every first Saturday, our baristas teach hearts, tulips and the elusive rosetta. Milk is on us.',
    body: [
      'Latte Art Saturdays are back from 4:00 to 5:30 PM on the first Saturday of every month. Eight seats, one espresso machine each pair, and a lot of very forgiving milk.',
      'Book a spot from the Rituals page, or ask Dew, our chat host, to point you there.',
    ],
  },
  {
    id: 'brown-butter-cookies',
    cat: 'recipes',
    title: 'Recipe: Our Brown Butter Cookies',
    date: '2026-07-14',
    read: 7,
    img: 'cookies',
    excerpt: 'The recipe we get asked for most. Brown the butter, rest the dough overnight, and be patient.',
    body: [
      'Brown 225g of butter until it smells like toffee and the solids turn hazelnut. Let it cool until just warm.',
      'Whisk in 200g dark brown sugar, 100g caster sugar, two eggs and a teaspoon of vanilla. Fold through 300g flour, a teaspoon of baking soda, a pinch of salt and 200g chopped dark chocolate.',
      'Here is the secret: rest the dough in the fridge overnight. Bake at 180°C for 11 minutes, finish with flaky salt, and wait five minutes before eating. That last part is the hardest.',
    ],
  },
  {
    id: 'garden-suppers',
    cat: 'events',
    title: 'Garden Suppers on the Terrace',
    date: '2026-06-28',
    read: 4,
    img: 'terrace',
    excerpt: 'Long tables, lantern light and a four-course menu from the Chef’s Table, every Friday through October.',
    body: [
      'On Friday evenings the terrace becomes one long table. Our chef cooks four courses from whatever the week has brought in, and the room stays open late.',
      'Seats are limited to twenty-four. Reserve through the Visit page and choose “Garden Supper” as your occasion.',
    ],
  },
];
