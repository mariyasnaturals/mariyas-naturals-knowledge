import type { APIRoute } from 'astro';
import { site } from '../config/site';
export const GET: APIRoute = () =>
  new Response(
    site.indexable
      ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap-index.xml\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
