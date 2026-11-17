/**
 * Product showcase data.
 *
 * Two rules hold everywhere in this file:
 *
 * 1. A card may only show a photograph we legitimately hold at full resolution.
 *    That means the four hero photographs of each listed hair-oil pack, which the
 *    owner publishes and which are committed here. Every other catalogue entry is
 *    presented honestly as a "browse in the store" tile.
 * 2. Every link is the exact permalink returned by the live Store API
 *    (`src/data/store.ts`), so no card can drift to a guessed slug.
 *
 * Names are the official catalogue names, unchanged. Descriptions are original,
 * factual, format-and-category statements written for this discovery page; they
 * are not copied from the store's marketing copy.
 */
import type { Product } from './products';
import { products as catalogue } from './products';
import { storeLinks, STORE_ORIGIN } from './store';
import { isPubliclyVisible } from './product-visibility';
import type { Locale } from '../i18n';

export type ShowcaseGroup = 'hairCare' | 'skinAndBody' | 'wellness' | 'tools';

export interface ShowcaseItem {
  /** Stable key, also used as the anchor id on the page. */
  id: string;
  /** The official product name in the store, verbatim. */
  officialName: string;
  group: ShowcaseGroup;
  /** Exact verified permalink. */
  href: string;
  /** Product id in the store, for traceability. */
  storeProductId: number;
  /** Photographs we hold locally; empty means the tile shows a brand card instead. */
  image?: Product['images']['main'];
  /** Gallery photographs, first one is already `image`. */
  gallery?: readonly Product['images']['main'][];
}

const bySlug = new Map(catalogue.map((product) => [product.slug, product]));

const withPhotos = (slug: string) => {
  const product = bySlug.get(slug);
  if (!product?.images.main) return {};
  const gallery = [product.images.main, ...product.images.gallery];
  return { image: product.images.main, gallery };
};

const showcaseCandidates: readonly ShowcaseItem[] = [
  {
    id: 'hair-oil-200-ml',
    officialName: 'Mariyas Herbal Hair Care Oil – 200 ml',
    group: 'hairCare',
    href: storeLinks.hairOil200,
    storeProductId: 3008,
    ...withPhotos('mariyas-hair-oil-200-ml'),
  },
  {
    id: 'hair-oil-500-ml',
    officialName: 'Mariyas Herbal Hair Care – 500 ml',
    group: 'hairCare',
    href: storeLinks.hairOil500,
    storeProductId: 3009,
    ...withPhotos('mariyas-hair-oil-500-ml'),
  },
  {
    id: 'hair-oil-combo',
    officialName: 'Mariyas Herbal Hair Care Oil',
    group: 'hairCare',
    href: storeLinks.hairOilCombo,
    storeProductId: 2865,
  },
];

/**
 * Only listings the site publishes may be showcased. A hidden-pending-photo
 * listing is dropped here even though its name and store link are perfectly
 * known: visibility is the owner's decision, not a side effect of having a photo.
 */
export const showcaseItems: readonly ShowcaseItem[] = showcaseCandidates.filter(
  (item) => isPubliclyVisible(item.storeProductId),
);

/**
 * The rest of the live catalogue, grouped for browsing. Only names and exact
 * links are carried; no photography and no pricing, because we do not hold
 * authorized full-resolution photographs for them and prices change.
 */
interface BrowseGroup {
  id: ShowcaseGroup;
  items: readonly { id: number; officialName: string }[];
}

const browseGroupCandidates: readonly BrowseGroup[] = [
  {
    id: 'hairCare',
    items: [
      { id: 2951, officialName: 'Amla And Aloe Vera Shampoo 200 ml' },
      { id: 2944, officialName: 'Amla And Indigo Shampoo 200 ml' },
      { id: 2869, officialName: 'Amla Shikkakai Shampoo 200 ml' },
      { id: 2945, officialName: 'Fenugreek Tulsi Neem Shampoo 200 ml' },
      { id: 2870, officialName: 'Honey Aloevera Shampoo 200 ml' },
      { id: 2871, officialName: 'Tulsi Shampoo 200 ml' },
      { id: 2868, officialName: 'Coconut Milk Shampoo 200 ml' },
      { id: 2867, officialName: 'Baby Hair Oil 200 ml' },
      { id: 2939, officialName: 'Hair Cream 30 g' },
      { id: 2879, officialName: 'Hair Pack & Wash Powder 100 g' },
      { id: 2884, officialName: 'Beard Oil 50 ml' },
      { id: 2881, officialName: 'Eyebrow Oil 10 ml' },
      { id: 2997, officialName: 'Shikkakai Powder 100 g' },
      { id: 2877, officialName: 'Henna Powder 100 g' },
      { id: 2954, officialName: 'Bhringraj Powder 100 g' },
      { id: 2986, officialName: 'Brahmi Powder 100 g' },
      { id: 2995, officialName: 'Nellikka Powder 100 g' },
      { id: 2996, officialName: 'Curry Leaves Powder 100 g' },
      { id: 2989, officialName: 'Reetha Powder 100 g' },
      { id: 2949, officialName: 'Indigo Powder 100 g' },
      { id: 2993, officialName: 'Wild Turmeric Powder 100 g' },
      { id: 2999, officialName: 'Multani Mitti Powder 100 g' },
    ],
  },
  {
    id: 'skinAndBody',
    items: [
      { id: 2883, officialName: 'Rose Water 200 ml' },
      { id: 2942, officialName: 'Rosemary Water 200 ml' },
      { id: 2947, officialName: 'Deshapushpam Shower Gel 250 ml' },
      { id: 2943, officialName: 'Five Flowers Body Cream 250 g' },
      { id: 2940, officialName: 'Body Cream 30 g' },
      { id: 2946, officialName: 'Saffron Face Cream 100 g' },
      { id: 2880, officialName: 'Lip Balm 10 g' },
      { id: 2882, officialName: 'Under Eye Dark Circle Oil 10 ml' },
      { id: 2893, officialName: 'Heal Crack Cream 25 g' },
      { id: 2891, officialName: 'Alovera Gel 100 g' },
      { id: 2890, officialName: 'Cucumber Gel 100 g' },
      { id: 2889, officialName: 'Saffron Gel 100 g' },
      { id: 2892, officialName: 'Papaya Gel 100 g' },
      { id: 2935, officialName: 'Hibiscus Gel 100 g' },
      { id: 2936, officialName: 'Neem Tulsi Gel 100 g' },
      { id: 2937, officialName: 'Lotus Gel 100 g' },
      { id: 2938, officialName: 'Mens Face Gel 100 g' },
      { id: 2876, officialName: 'Strawberry Gel 100 g' },
      { id: 2875, officialName: 'Rosepetal Gel 100 g' },
      { id: 2874, officialName: 'Redwine Gel 100 g' },
      { id: 2888, officialName: 'Orange Peel Face Pack 100 g' },
      { id: 2887, officialName: 'Lotus Petals Face Pack 100 g' },
      { id: 2886, officialName: 'Rose Petals Face Pack 100 g' },
      { id: 2885, officialName: 'Papaya Face Pack 100 g' },
      { id: 2873, officialName: 'Mixed Fruits Face Pack 100 g' },
      { id: 2872, officialName: 'Herbal Face Pack 100 g' },
      { id: 2878, officialName: 'Chemparathi Thali 100 g' },
      { id: 2928, officialName: 'Mariyas Fairness Natural Soap' },
      { id: 2927, officialName: 'Saffron Fairness Oil' },
      { id: 2894, officialName: 'Kajal' },
      { id: 3001, officialName: 'Nalpamaram Powder 100 g' },
      { id: 3002, officialName: 'Triphala Powder 100 g' },
      { id: 2994, officialName: 'Manjistha Powder 100 g' },
      { id: 2987, officialName: 'Tulsi Powder 100 g' },
      { id: 2985, officialName: 'Neem Powder 100 g' },
      { id: 2988, officialName: 'Pathimugham Powder 100 g' },
      { id: 2992, officialName: 'Sandalwood Powder 100 g' },
      { id: 2990, officialName: 'Red Sandalwood Powder 100 g' },
      { id: 2998, officialName: 'Vetiver Powder 100 g' },
      { id: 3000, officialName: 'Irattimadhuram Powder 100 g' },
      { id: 3004, officialName: 'Green Gram Powder 100 g' },
      { id: 3005, officialName: 'Navara Powder 100 g' },
      { id: 3003, officialName: 'Kolarakku Powder 100 g' },
      { id: 2929, officialName: 'Arrowroot Powder 250 g' },
    ],
  },
  {
    id: 'wellness',
    items: [
      { id: 3012, officialName: 'Ghee – Vechoor Cow 500 g' },
      { id: 3011, officialName: 'Chyavanaprash' },
      { id: 3007, officialName: 'Karkidaka Kanji' },
      { id: 2952, officialName: 'Ashwagandha Powder 100 g' },
      { id: 2953, officialName: 'Moringa Leaves Powder 100 g' },
      { id: 2991, officialName: 'Shatavari Powder 100 g' },
      { id: 2950, officialName: 'Bruhath Dhantapala Thailam 500 ml' },
      { id: 2926, officialName: 'Mariyas Virgin Coconut Oil' },
      { id: 2925, officialName: 'Mariyas Pure Organic Honey 250 g' },
      { id: 2866, officialName: 'Baby Massage Oil 200 ml' },
    ],
  },
  {
    id: 'tools',
    items: [
      { id: 2930, officialName: 'Mariyas Oil Treated Comb – Dual' },
      { id: 2931, officialName: 'Mariyas Oil Treated Comb – Wide' },
      { id: 2932, officialName: 'Mariyas Oil Treated Comb – Fine' },
      { id: 2933, officialName: 'Mariyas Oil Treated Comb – Combo Pack' },
      { id: 2948, officialName: 'Mariyas Hair & Skin Care Kit' },
    ],
  },
];

/** The same policy applies to the browse-in-store groups: hidden listings are
 * not offered, and a group left with nothing is not offered either. */
export const browseGroups: readonly BrowseGroup[] = browseGroupCandidates
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => isPubliclyVisible(item.id)),
  }))
  .filter((group) => group.items.length > 0);

/** Exact product URLs for the browse groups, verified on the same read. */
const browseHrefs: Record<number, string> = {
  2951: 'amla-and-aloe-vera-shampoo-200-ml',
  2944: 'amla-and-indigo-shampoo-200-ml',
  2869: 'amla-shikkakai-shampoo-200-ml',
  2945: 'fenugreek-tulsi-neem-shampoo-200-ml',
  2870: 'honey-aloevera-shampoo-200-ml',
  2871: 'tulsi-shampoo-200-ml',
  2868: 'coconut-milk-shampoo-200-ml',
  2867: 'baby-hair-oil-200-ml',
  2939: 'hair-cream-30-g',
  2879: 'hair-pack-wash-powder-100-g',
  2884: 'beard-oil-50-ml',
  2881: 'eyebrow-oil-10-ml',
  2997: 'shikkakai-powder-100-g',
  2877: 'henna-powder-100-g',
  2954: 'bhringraj-powder-100-g',
  2986: 'brahmi-powder-100-g',
  2995: 'nellikka-powder-100-g',
  2996: 'curry-leaves-powder-100-g',
  2989: 'reetha-powder-100-g',
  2949: 'indigo-powder-100-g',
  2993: 'wild-turmeric-powder-100-g',
  2999: 'multani-mitti-powder-100-g',
  2883: 'rose-water-200-ml',
  2942: 'rosemary-water-200-ml',
  2947: 'deshapushpam-shower-gel-250-ml',
  2943: 'five-flowers-body-cream-250-g',
  2940: 'body-cream-30-g',
  2946: 'saffron-face-cream-100-g',
  2880: 'lip-balm-10-g',
  2882: 'under-eye-dark-circle-oil-10-ml',
  2893: 'heel-crack-cream-25-g',
  2891: 'alovera-gel-100-g',
  2890: 'cucumber-gel-100-g',
  2889: 'saffron-gel-100-g',
  2892: 'papaya-gel-100-g',
  2935: 'hibiscus-gel-100-g',
  2936: 'neem-tulsi-gel-100-g',
  2937: 'lotus-gel-100-g',
  2938: 'mens-face-gel-100-g',
  2876: 'strawberry-gel-100-g',
  2875: 'rosepetal-gel-100-g',
  2874: 'redwine-gel-100-g',
  2888: 'orange-peel-face-pack-100-g',
  2887: 'lotus-petals-face-pack-100-g',
  2886: 'rose-petals-face-pack-100-g',
  2885: 'papaya-face-pack-100-g',
  2873: 'mixed-fruits-face-pack-100-g',
  2872: 'herbal-face-pack-100-g',
  2878: 'chemparathi-thali-100-g',
  2928: 'mariyas-fairness-natural-soap',
  2927: 'saffron-fairness-oil',
  2894: 'kajal',
  3001: 'nalpamaram-powder-100-g',
  3002: 'triphala-powder-100-g',
  2994: 'manjistha-powder-100-g',
  2987: 'tulsi-powder-100-g',
  2985: 'neem-powder-100-g',
  2988: 'pathimugham-powder-100-g',
  2992: 'sandalwood-powder-100-g',
  2990: 'red-sandalwood-powder-100-g',
  2998: 'vetiver-powder-100-g',
  3000: 'irattimadhuram-powder-100-g',
  3004: 'green-gram-powder-100-g',
  3005: 'navara-powder-100-g',
  3003: 'kolarakku-powder-100-g',
  2929: 'arrowroot-powder-250-g',
  3012: 'ghee-vechoor-cow-500-g',
  3011: 'chyavanaprash',
  3007: 'karkidaka-kanji',
  2952: 'ashwagandha-powder-100-g',
  2953: 'moringa-leaves-powder-100-g',
  2991: 'shatavari-powder-100-g',
  2950: 'bruhath-dhantapala-thailam-500-ml',
  2926: 'mariyas-virgin-coconut-oil',
  2925: 'mariyas-pure-organic-honey-250-g',
  2866: 'baby-massage-oil-200-ml',
  2930: 'mariyas-oil-treated-comb-dual',
  2931: 'mariyas-oil-treated-comb-wide',
  2932: 'mariyas-oil-treated-comb-fine',
  2933: 'mariyas-oil-treated-comb-combo-pack',
  2948: 'mariyas-hair-skin-care-kit',
};

export const productHref = (storeProductId: number): string => {
  const slug = browseHrefs[storeProductId];
  if (!slug)
    throw new Error(`No verified store slug for product ${storeProductId}`);
  return `${STORE_ORIGIN}/product/${slug}/`;
};

/** Localized group labels and short answer copy, keyed by locale. */
export const groupCopy: Record<
  ShowcaseGroup,
  Record<Locale, { label: string; blurb: string }>
> = {
  hairCare: {
    en: {
      label: 'Hair care',
      blurb: 'Oils, shampoos, powders and combs in the current catalogue.',
    },
    ml: {
      label: 'മുടി സംരക്ഷണം',
      blurb: 'എണ്ണകൾ, ഷാംപൂകൾ, പൊടികൾ, ചീർപ്പുകൾ എന്നിവ നിലവിലെ കാറ്റലോഗിൽ.',
    },
    hi: {
      label: 'बालों की देखभाल',
      blurb: 'तेल, शैम्पू, पाउडर और कंघियाँ वर्तमान कैटलॉग में।',
    },
    ta: {
      label: 'முடிப் பராமரிப்பு',
      blurb: 'எண்ணெய்கள், ஷாம்பூக்கள், பொடிகள், சீப்புகள் தற்போதைய பட்டியலில்.',
    },
    kn: {
      label: 'ಕೂದಲ ಆರೈಕೆ',
      blurb: 'ಎಣ್ಣೆ, ಶಾಂಪೂ, ಪುಡಿಗಳು ಮತ್ತು ಬಾಚಣಿಗೆಗಳು ಪ್ರಸ್ತುತ ಪಟ್ಟಿಯಲ್ಲಿವೆ.',
    },
  },
  skinAndBody: {
    en: {
      label: 'Skin & body',
      blurb: 'Gels, face packs, floral waters and everyday skin care.',
    },
    ml: {
      label: 'ചർമ്മവും ശരീരവും',
      blurb: 'ജെല്ലുകൾ, ഫേസ് പാക്കുകൾ, പൂവെള്ളം, ദൈനംദിന ചർമ്മ സംരക്ഷണം.',
    },
    hi: {
      label: 'त्वचा और शरीर',
      blurb: 'जेल, फेस पैक, फूलों का पानी और रोज़ की त्वचा देखभाल।',
    },
    ta: {
      label: 'சருமமும் உடலும்',
      blurb:
        'ஜெல்கள், ஃபேஸ் பேக்குகள், பூநீர் மற்றும் அன்றாடச் சருமப் பராமரிப்பு.',
    },
    kn: {
      label: 'ಚರ್ಮ ಮತ್ತು ದೇಹ',
      blurb: 'ಜೆಲ್‌ಗಳು, ಫೇಸ್ ಪ್ಯಾಕ್‌ಗಳು, ಹೂವಿನ ನೀರು ಮತ್ತು ದೈನಂದಿನ ಚರ್ಮ ಆರೈಕೆ.',
    },
  },
  wellness: {
    en: {
      label: 'Wellness',
      blurb: 'Traditional foods, oils and everyday wellness.',
    },
    ml: {
      label: 'ആരോഗ്യം',
      blurb: 'പരമ്പരാഗത ഭക്ഷണങ്ങൾ, എണ്ണകൾ, ദൈനംദിന ആരോഗ്യ സംരക്ഷണം.',
    },
    hi: {
      label: 'स्वास्थ्य',
      blurb: 'पारंपरिक खाद्य, तेल और रोज़ की देखभाल।',
    },
    ta: {
      label: 'நலம்',
      blurb: 'பாரம்பரிய உணவுகள், எண்ணெய்கள், அன்றாட நலப் பராமரிப்பு.',
    },
    kn: {
      label: 'ಆರೋಗ್ಯ',
      blurb: 'ಸಾಂಪ್ರದಾಯಿಕ ಆಹಾರ, ಎಣ್ಣೆಗಳು ಮತ್ತು ದೈನಂದಿನ ಆರೋಗ್ಯ ಆರೈಕೆ.',
    },
  },
  tools: {
    en: {
      label: 'Kits & tools',
      blurb: 'Combs and sets in the current catalogue.',
    },
    ml: {
      label: 'കിറ്റുകളും ഉപകരണങ്ങളും',
      blurb: 'നിലവിലെ കാറ്റലോഗിലെ ചീർപ്പുകളും സെറ്റുകളും.',
    },
    hi: {
      label: 'किट और साधन',
      blurb: 'वर्तमान कैटलॉग में कंघियाँ और सेट।',
    },
    ta: {
      label: 'கிட்கள் மற்றும் கருவிகள்',
      blurb: 'தற்போதைய பட்டியலில் சீப்புகள் மற்றும் தொகுப்புகள்.',
    },
    kn: {
      label: 'ಕಿಟ್‌ಗಳು ಮತ್ತು ಸಾಧನಗಳು',
      blurb: 'ಪ್ರಸ್ತುತ ಪಟ್ಟಿಯಲ್ಲಿ ಬಾಚಣಿಗೆಗಳು ಮತ್ತು ಸೆಟ್‌ಗಳು.',
    },
  },
};
