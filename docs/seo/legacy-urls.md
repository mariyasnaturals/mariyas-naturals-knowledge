# Legacy URLs and redirects — what can be mapped, and what is still missing

Nothing in this document is enabled. No server block has been touched, and the
proposed map lives next to the release as
[`release/nginx/legacy-redirects.proposed.conf`](../../release/nginx/legacy-redirects.proposed.conf).

## 1. What is live at `mariyasnaturals.in` today

Checked on 2026-11-17:

- `/` serves **the static discovery site**, not WordPress — cinematic homepage,
  the same 59 products, `robots.txt` with `Allow: /` and the sitemap line.
- `/en/hair-oil/` returns **404 from nginx**, and `/wp-sitemap.xml` returns 404.
  So the deployed revision predates the hair-oil pillar and the evidence routes:
  the live site is the previously approved build, and the WordPress site is gone.

That changes the redirect problem. There is no WordPress installation left to
enumerate; the historical URL inventory has to come from an external source:

| Source                                          | Who has it                                | What it gives                                         |
| ----------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Google Search Console → Pages, last 16 months   | Owner (property for `mariyasnaturals.in`) | URLs that were indexed or crawled, with impressions   |
| The host's access log (`/home/mariyaswp/logs/`) | Owner (CloudPanel)                        | Every path requested, including 404s since the switch |
| A pre-switch `wp-sitemap.xml` export            | Owner, if one was saved                   | The complete inventory in one file                    |

Without one of those, any list of "legacy URLs" would be a guess. None is written.

## 2. What can be mapped deterministically today

The old WooCommerce slugs are still the store's slugs, and
`catalogue/catalogue-source.json` records every one of them with its SKU, so
`/product/<slug>/` can be resolved mechanically:

```bash
node scripts/build-legacy-redirects.mjs   # regenerates the proposed map
```

The script emits, from the catalogue and the visibility policy:

- **85 product rules** — a visible product goes to its static page on `.in`
  (`/product/alovera-gel-100-g/` → `/en/products/alovera-gel-100gm-19526/`); a
  hidden listing goes to the official `.com` URL, because the store still sells it
  and the discovery site deliberately does not list it;
- **13 category rules** — `/product-category/<slug>/` → the matching collection,
  with `accessories` (where `.com` files the hair oil) going to the catalogue index
  because `.in` has no accessories collection;
- **6 commerce rules** — `/cart/`, `/checkout/`, `/my-account/`, `/shop/`,
  `/wishlist/`, `/compare/` → the same path on `.com`, since those are
  transactional and `.in` has no cart;
- **WordPress artefacts** → `410 Gone` (`/wp-login.php`, `/wp-admin/`,
  `/wp-json/`, `/feed/`, `/?s=`, `/xmlrpc.php`).

The withdrawn 1-litre hair-oil listing is recorded by store id only (id 3010, "₹0,
no photograph, no longer sold"); its legacy slug is not in any snapshot, so the
generated file reports it as needing manual mapping to `410 Gone` rather than
inventing a URL for it.

## 3. How it would be applied (when the owner approves)

Inside the apex `:443` server block, after the static root:

```nginx
map $uri $legacy_target {
    # …generated entries…
    default "";
}
# inside the server block:
if ($legacy_target = gone) { return 410; }
if ($legacy_target != "")  { return 301 $legacy_target; }
```

Two cautions that matter more than the map itself:

1. **Order.** The static site owns `/`, `/en/…` and the asset prefixes. The map must
   only fire for legacy prefixes, or a stale rule will shadow a real page.
2. **Verify before enabling.** Cross-check the generated entries against Search
   Console or the access log, delete the rules for URLs nobody ever requested (a
   301 that was never needed is still a 301 you have to maintain), and only then
   paste.

## 4. Cross-domain redirects

Some legacy URLs point at things `.in` will never host: a hidden product, a cart, a
checkout, an account page. Those 301 to `.com`, which is legitimate — the store is
the surviving authority for its own URLs. What is _not_ done:

- no cross-domain canonical from `.in` pages to `.com` (each domain keeps
  self-canonicals; see `README.md` §3);
- no redirect from `.in` product pages to `.com` product pages — that would erase
  the discovery pages this project exists to build;
- no `.com` change of any kind.
