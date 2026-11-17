import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { resolveSiteConfig } from './src/config/resolve-site.mjs';

/**
 * Evidence-gated routes stay out of the sitemap until the owner has supplied and
 * approved the underlying documents; they also carry `noindex, follow` on the
 * page itself. Both read the same switch.
 */
const evidence = JSON.parse(
  readFileSync(
    new URL('./src/data/evidence-publication.json', import.meta.url),
    'utf8',
  ),
);
const gatedRoutes = [
  evidence.awards ? null : '/awards/',
  evidence.certifications ? null : '/certifications/',
].filter(Boolean);
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
      filter: (page) => {
        const { pathname } = new URL(page);
        if (/^\/$/.test(pathname)) return false;
        return !gatedRoutes.some((route) => pathname.includes(route));
      },
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
