# Cinematic hero and automatic staging

`feature/cinematic-homepage` pushes and PRs run automatic CI: locked dependencies, FFmpeg/ffprobe, Astro, formatting, Node/Python security tests, production build, static/media policy checks and Chromium/accessibility tests. A successful run publishes an **UNAPPROVED** preview ZIP tied to the exact push/PR source SHA. Failed checks stop packaging. Production WordPress is never a target.

## Deployment approval boundary

The existing server trusts independently owner-signed releases. Raw GitHub source pushes are not signed releases. The new `ops/automatic_staging.py` automates **already signed releases**, preserving this architecture. It does not sign, upload source, install trust, update a baseline, enable first apply or modify WordPress.

**This does not implement unattended deployment of every unsigned code push.** The requested deployment-mode choice is pending: retain owner signing, or explicitly authorize a separate unattended staging identity. No owner private key may enter Actions. Do not enable a replacement approval model merely to make CI green.

Once an owner-approved signed release is published to `staging-release`, an enabled server poller applies it through the existing pinned puller, purges .cloud HTML/robots/sitemap URLs through Cloudflare if configured, and compares real public language-page bytes with installed files. The wrapper verifies the entire installed profile against an independently supplied checksum inventory before execution. It refuses a missing first manually authorized deployment, disabled configuration, wrong staging root/origin, pending transaction or changed tools. Repeated releases are not applied again; purge/health failures are retried and never recorded as success.

The new hero changes intentionally do not match the earlier approved baseline. Before publishing them through the owner-signed pipeline, independently review the captures/source and approve the exact new release policy/baseline using the versioned trust procedure. Neither CI nor this helper automatically promotes HEAD.

## Secrets and one-time setup

No GitHub SSH/VPS deployment secrets or owner-signing secrets are used by this signed outbound-pull path. `STAGING_DEPLOY_HOST`, `STAGING_DEPLOY_USER` and `STAGING_DEPLOY_KEY` are intentionally unnecessary. The existing VPS read-only GitHub key and pinned owner public key remain server-side.

Optional Cloudflare credentials: a token with **Cache Purge only**, scoped to the .cloud zone, and that zone's ID (commonly called `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`). Put these in the private VPS automation JSON as `cloudflare.api_token` and `cloudflare.zone_id`; do not commit them. No whole-zone purge is issued; .in/.com URLs are never purged. If no Cloudflare caching is used, omit `cloudflare`. If Cloudflare caches HTML, configure these values or a reviewed HTML cache-bypass rule. Public byte verification deliberately fails if stale/minified/transformed HTML differs from the installed release.

After the deployment-mode choice, review this helper, its SHA-256 and these setup instructions. Through the existing authorized site-user administration connection, install the reviewed helper outside the web root as `/home/mariyascloud/.local/bin/mariyas-auto-staging.py` (owner-only). Create `/home/mariyascloud/.config/mariyas-pull/automatic.json` mode 0600 from `ops/automatic-staging.example.json`. Fill the independently reviewed installed profile path and checksum-inventory digest; use the existing pull config, never a public directory.

Keep the template disabled while reviewing. Before enabling it, the existing pull config must already be explicitly enabled and a manually approved first apply must have created the preserved `current.json`/sequence state. No key creation, permission correction, site reconfiguration or redo of completed setup is needed. Do not overwrite existing installations. Add optional private Cloudflare configuration:

```json
{
  "cloudflare": {
    "zone_id": "YOUR_CLOUD_ZONE_ID",
    "api_token": "YOUR_ZONE_SCOPED_CACHE_PURGE_TOKEN"
  }
}
```

After explicit automation approval, set only the automation JSON's `enabled` flag to true. Run once as mariyascloud:

```sh
python3 /home/mariyascloud/.local/bin/mariyas-auto-staging.py --config /home/mariyascloud/.config/mariyas-pull/automatic.json
```

Only after that succeeds, install the following site-user cron entry (not root); keep the private log outside the web root with mode 0600 and verify `flock` is installed. This repository does not install or enable the job:

```cron
* * * * * flock -n /home/mariyascloud/.local/state/mariyas-pull/automatic.lock python3 /home/mariyascloud/.local/bin/mariyas-auto-staging.py --config /home/mariyascloud/.config/mariyas-pull/automatic.json >> /home/mariyascloud/.local/state/mariyas-pull/automatic.log 2>&1
```

Cloudflare purges happen after a signed apply and before public verification. An apply followed by failed health/purge may have changed staging; the command exits nonzero and does not write a success receipt. Inspect the retained puller journal/backup and follow the existing separately authorized rollback/recovery procedure; never reset replay state. Pause the automation job before manual recovery. Keep private logs under rotation/monitoring.

## Hero presentation

The film uses cover framing for all eight timed chapters. A single accessible headline overlay changes to eight unique localized titles; original timing, responsive source selection, pause controls, reduced motion and save-data behavior remain. The numbered center chip, scene numbers and vertical edition label are removed. Static chapters use full-height cover media and white serif overlays with gradient protection. Model and product remain separate full-bleed panels; the original files are unchanged. Cover deliberately crops the source edges, using subject-focused positions rather than letterboxing.

Browser tests seek every chapter at 1440, 390 and 360 pixels, verify captions/cover layout/no numbering/no scroll jumps, and capture real media. Review the captures before authorizing the updated release baseline.
