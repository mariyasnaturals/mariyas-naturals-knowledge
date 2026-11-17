/**
 * Build the branded Open Graph card from the approved photograph and the official
 * logo. Nothing is generated: the photograph is cropped, the logo is composited,
 * and the type is set from the same self-hosted Latin families the site serves.
 *
 *   public/brand/og-default.jpg   1200 x 630, photograph + wordmark
 *   public/brand/og-logo.jpg      1200 x 630, logo + brand line (safe fallback)
 *
 * Run after `npm run brand:assets` so the keyed logo already exists.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const brandDir = join(publicDir, 'brand');
await mkdir(brandDir, { recursive: true });

const GREEN = '#063D2A';
const GOLD = '#D7B15D';
const CREAM = '#F6EFDF';

const logo = await sharp(join(brandDir, 'logo.png'))
  .resize(190, 190)
  .toBuffer();

/* ------------------------------------------------------- photograph card -- */

const CARD = { width: 1200, height: 630 };

// The model sits on the right third of the frame, so shift the crop right and
// leave the left third as clean studio wall for the type block.
const photo = await sharp(join(publicDir, 'hero', 'model-landscape-2400.webp'))
  .resize({ width: 1800 })
  .extract({ left: 260, top: 0, width: 1200, height: 630 })
  .modulate({ brightness: 0.96 })
  .toBuffer();

// A soft left-edge scrim keeps the type legible without a hard panel edge.
const scrim = Buffer.from(
  `<svg width="${CARD.width}" height="${CARD.height}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stop-color="${GREEN}" stop-opacity="0.94"/>
         <stop offset="0.42" stop-color="${GREEN}" stop-opacity="0.72"/>
         <stop offset="0.72" stop-color="${GREEN}" stop-opacity="0"/>
       </linearGradient>
       <linearGradient id="v" x1="0" y1="1" x2="0" y2="0">
         <stop offset="0" stop-color="${GREEN}" stop-opacity="0.55"/>
         <stop offset="0.45" stop-color="${GREEN}" stop-opacity="0"/>
       </linearGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#g)"/>
     <rect width="100%" height="100%" fill="url(#v)"/>
   </svg>`,
);

const type = Buffer.from(
  `<svg width="${CARD.width}" height="${CARD.height}" xmlns="http://www.w3.org/2000/svg">
     <text x="74" y="150" font-family="Inter Variable, Inter, sans-serif"
       font-size="21" letter-spacing="5.6" fill="${GOLD}">MARIYAS NATURALS</text>
     <text x="72" y="270" font-family="Cormorant Garamond Variable, Cormorant Garamond, Georgia, serif"
       font-size="86" font-weight="500" fill="${CREAM}">A daily ritual.</text>
     <text x="72" y="356" font-family="Cormorant Garamond Variable, Cormorant Garamond, Georgia, serif"
       font-size="86" font-weight="500" fill="${CREAM}">Rooted in nature.</text>
     <text x="74" y="424" font-family="Inter Variable, Inter, sans-serif"
       font-size="26" fill="${CREAM}" opacity="0.92">Herbal hair care, skin care and everyday wellness.</text>
     <rect x="74" y="470" width="72" height="2" fill="${GOLD}" opacity="0.85"/>
     <text x="74" y="522" font-family="Inter Variable, Inter, sans-serif"
       font-size="21" letter-spacing="1.2" fill="${CREAM}" opacity="0.82">mariyasnaturals.com</text>
   </svg>`,
);

const ogDefault = sharp({
  create: {
    width: CARD.width,
    height: CARD.height,
    channels: 3,
    background: GREEN,
  },
})
  .composite([
    { input: photo, left: 0, top: 0 },
    { input: scrim, left: 0, top: 0 },
    { input: logo, left: 946, top: 46 },
    { input: type, left: 0, top: 0 },
  ])
  .jpeg({ quality: 88, mozjpeg: true });
const ogDefaultInfo = await ogDefault.toFile(join(brandDir, 'og-default.jpg'));

/* ------------------------------------------------------------- logo card -- */

const logoLarge = await sharp(join(brandDir, 'logo.png'))
  .resize(300, 300)
  .toBuffer();
const logoCard = Buffer.from(
  `<svg width="${CARD.width}" height="${CARD.height}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <radialGradient id="bg" cx="50%" cy="42%" r="72%">
         <stop offset="0" stop-color="#0d5a3e"/>
         <stop offset="1" stop-color="${GREEN}"/>
       </radialGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#bg)"/>
     <text x="600" y="470" text-anchor="middle"
       font-family="Cormorant Garamond Variable, Cormorant Garamond, Georgia, serif"
       font-size="84" font-weight="500" fill="${CREAM}">Mariyas Naturals</text>
     <text x="600" y="524" text-anchor="middle"
       font-family="Inter Variable, Inter, sans-serif" font-size="22" letter-spacing="4.4"
       fill="${GOLD}">NATURE-INSPIRED HAIR &amp; SKIN CARE</text>
   </svg>`,
);
const ogLogoInfo = await sharp({
  create: {
    width: CARD.width,
    height: CARD.height,
    channels: 3,
    background: GREEN,
  },
})
  .composite([
    { input: logoCard, left: 0, top: 0 },
    { input: logoLarge, left: 450, top: 108 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(join(brandDir, 'og-logo.jpg'));

const manifestPath = join(root, 'src/data/brand-assets.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.social = {
  ogDefault: {
    path: '/brand/og-default.jpg',
    width: ogDefaultInfo.width,
    height: ogDefaultInfo.height,
    bytes: ogDefaultInfo.size,
  },
  ogLogo: {
    path: '/brand/og-logo.jpg',
    width: ogLogoInfo.width,
    height: ogLogoInfo.height,
    bytes: ogLogoInfo.size,
  },
  composition:
    'Approved photograph, official logo and brand type; no generative imagery and no alteration of the model.',
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Composed og-default.jpg and og-logo.jpg at 1200x630.');
