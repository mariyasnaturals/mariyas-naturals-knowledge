import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { resolveSiteConfig } from './src/config/resolve-site.mjs';
const site = resolveSiteConfig({
  ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''),
  ...process.env,
});
const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'mariyasnaturals.cloud',
  'www.mariyasnaturals.cloud',
  '.e2b.app',
];
export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  // The review preview is served through an external proxy host; it must be
  // allowed explicitly or Vite blocks every request with HTTP 403.
  server: {
    allowedHosts: ALLOWED_HOSTS,
  },
  preview: {
    host: true,
    allowedHosts: ALLOWED_HOSTS,
  },
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.match(/^\/$/),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ml: 'ml', hi: 'hi', ta: 'ta', kn: 'kn' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: { __SITE_CONFIG__: JSON.stringify(site) },
  },
});
