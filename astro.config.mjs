import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { resolveSiteConfig } from './src/config/resolve-site.mjs';
const site = resolveSiteConfig({
  ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''),
  ...process.env,
});
export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.match(/^\/$/),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ml: 'ml', hi: 'hi', ta: 'ta' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: { __SITE_CONFIG__: JSON.stringify(site) },
  },
});
