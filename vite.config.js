import { defineConfig } from 'vite';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { renderers } from './src/data/render.js';

const root = dirname(fileURLToPath(import.meta.url));
const pages = ['index', 'menu', 'story', 'rituals', 'visit', 'journal', '404'];

/**
 * Build-time HTML partials: `<!-- @include partials/header.html -->`, and
 * data-driven blocks: `<!-- @render menu-grid -->` (see src/data/render.js).
 * The current page's nav link (data-nav="<page>") gets aria-current="page"
 * so the active state is in the static HTML — no runtime templating.
 */
function htmlIncludes() {
  const include = (html, page, depth = 0) =>
    html.replace(/<!--\s*@include\s+([\w./-]+)\s*-->/g, (_, file) => {
      if (depth > 4) return '';
      const partial = fs.readFileSync(resolve(root, file), 'utf8');
      return include(partial, page, depth + 1);
    }).replace(/<!--\s*@render\s+([\w-]+)\s*-->/g, (_, name) => {
      if (!renderers[name]) throw new Error(`Unknown renderer: ${name}`);
      return renderers[name]();
    }).replace(new RegExp(`data-nav="${page}"`, 'g'), `data-nav="${page}" aria-current="page"`);

  return {
    name: 'oiyo-html-includes',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        return include(html, basename(ctx.filename, '.html'));
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, '/').includes('/partials/')) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  plugins: [htmlIncludes()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 650,
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
    rolldownOptions: {
      input: Object.fromEntries(pages.map((p) => [p === '404' ? 'notfound' : p, resolve(root, `${p}.html`)])),
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three/ },
            { name: 'motion', test: /node_modules[\\/](gsap|lenis)/ },
          ],
        },
      },
    },
  },
});
