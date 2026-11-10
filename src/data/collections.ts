import type { ProductCategory } from './media-types';
import type { Locale, Dictionary } from '../i18n';
import { categoryArtwork } from './media';
export const collectionKeys: readonly ProductCategory[] = [
  'hair-care',
  'baby-care',
  'skin-care',
  'herbal-powders',
  'combo',
  'wellness',
];
export const collectionPath = (lang: Locale, category: ProductCategory) =>
  `/${lang}/collections/${category}/`;
export function collectionImage(category: ProductCategory, t: Dictionary) {
  return categoryArtwork(category, {
    en: `Mariyas Naturals ${t.categories[category]} collection artwork from the current store`,
    ml: `മരിയാസ് നാച്വറൽസ് ${t.categories[category]} ശേഖരത്തിന്റെ ചിത്രം`,
    hi: `मरियास नैचुरल्स ${t.categories[category]} संग्रह की छवि`,
    ta: `மரியாஸ் நேச்சுரல்ஸ் ${t.categories[category]} தொகுப்பின் படம்`,
  });
}
