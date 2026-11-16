/**
 * Phase 5 spotlights — real products, real pack photographs, verified permalinks.
 *
 * Every card now renders the official store photograph for *that exact listing*,
 * imported through the audited sync (`scripts/fetch-com-snapshot.mjs` +
 * `scripts/sync-com-catalogue.mjs`) and served as a local WebP derivative. The
 * caption states what the photograph is, and no photograph is ever borrowed from
 * a neighbouring product or from a category banner.
 *
 * Copy is limited to format facts (name, size, category) plus a single neutral
 * descriptive line. No benefit claims, no health claims, no prices.
 */
import type { Localized } from './living-copy';

export interface SpotlightItem {
  id: string;
  /** Official store name, verbatim. */
  name: string;
  /** Verified permalink. */
  href: string;
  storeProductId: number;
  /** Local product page, when this site has one. */
  localSlug?: string;
  /** Approved local image id, when we hold a truthful photograph. */
  imageId?: string;
  /** What that photograph actually is, so the caption stays truthful. */
  imageNote: Localized;
  /** One neutral line about the format. */
  line: Localized;
}

const note = (
  en: string,
  ml: string,
  hi: string,
  ta: string,
  kn: string,
): Localized => ({ en, ml, hi, ta, kn });

export const spotlightItems: readonly SpotlightItem[] = [
  {
    id: 'coconut-milk-shampoo',
    name: 'Coconut Milk Shampoo 200 ml',
    href: 'https://www.mariyasnaturals.com/product/coconut-milk-shampoo-200-ml/',
    storeProductId: 2868,
    localSlug: 'coconut-milk-shampoo-200ml-19191',
    imageId: 'product-media-4316',
    imageNote: note(
      'Official store photograph',
      'ഔദ്യോഗിക സ്റ്റോർ ചിത്രം',
      'आधिकारिक स्टोर की फ़ोटो',
      'அதிகாரப்பூர்வ கடைப் படம்',
      'ಅಧಿಕೃತ ಅಂಗಡಿ ಚಿತ್ರ',
    ),
    line: note(
      'A 200 ml hair wash in the current catalogue.',
      'നിലവിലെ കാറ്റലോഗിലെ 200 ml ഹെയർ വാഷ്.',
      'मौजूदा कैटलॉग में 200 ml हेयर वॉश।',
      'தற்போதைய பட்டியலில் 200 ml ஹேர் வாஷ்.',
      'ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಲ್ಲಿ 200 ml ಹೇರ್ ವಾಶ್.',
    ),
  },
  {
    id: 'baby-massage-oil',
    name: 'Baby Massage Oil 200 ml',
    href: 'https://www.mariyasnaturals.com/product/baby-massage-oil-200-ml/',
    storeProductId: 2866,
    localSlug: 'baby-massage-oil-200ml-19187',
    imageId: 'product-media-4799',
    imageNote: note(
      'Official store photograph',
      'ഔദ്യോഗിക സ്റ്റോർ ചിത്രം',
      'आधिकारिक स्टोर की फ़ोटो',
      'அதிகாரப்பூர்வ கடைப் படம்',
      'ಅಧಿಕೃತ ಅಂಗಡಿ ಚಿತ್ರ',
    ),
    line: note(
      'A 200 ml massage oil from the baby-care range.',
      'ബേബി കെയർ ശ്രേണിയിലെ 200 ml മസാജ് ഓയിൽ.',
      'बेबी केयर रेंज से 200 ml मालिश तेल।',
      'குழந்தை பராமரிப்பு வரிசையின் 200 ml மசாஜ் எண்ணெய்.',
      'ಮಗು ಆರೈಕೆ ಶ್ರೇಣಿಯ 200 ml ಮಸಾಜ್ ಎಣ್ಣೆ.',
    ),
  },
  {
    id: 'baby-hair-oil',
    name: 'Baby Hair Oil 200 ml',
    href: 'https://www.mariyasnaturals.com/product/baby-hair-oil-200-ml/',
    storeProductId: 2867,
    localSlug: 'baby-hair-oil-200ml-19189',
    imageId: 'product-media-4796',
    imageNote: note(
      'Official store photograph',
      'ഔദ്യോഗിക സ്റ്റോർ ചിത്രം',
      'आधिकारिक स्टोर की फ़ोटो',
      'அதிகாரப்பூர்வ கடைப் படம்',
      'ಅಧಿಕೃತ ಅಂಗಡಿ ಚಿತ್ರ',
    ),
    line: note(
      'A 200 ml hair oil listed in baby care.',
      'ബേബി കെയറിൽ ലിസ്റ്റ് ചെയ്ത 200 ml ഹെയർ ഓയിൽ.',
      'बेबी केयर में सूचीबद्ध 200 ml हेयर ऑयल।',
      'குழந்தை பராமரிப்பில் பட்டியலிடப்பட்ட 200 ml ஹேர் ஆயில்.',
      'ಮಗು ಆರೈಕೆಯಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಿದ 200 ml ಹೇರ್ ಆಯಿಲ್.',
    ),
  },
  {
    id: 'chyavanaprash',
    name: 'Chyavanaprash',
    href: 'https://www.mariyasnaturals.com/product/chyavanaprash/',
    storeProductId: 3011,
    localSlug: 'chyavanaprash-90605',
    imageId: 'product-media-4742',
    imageNote: note(
      'Official store photograph',
      'ഔദ്യോഗിക സ്റ്റോർ ചിത്രം',
      'आधिकारिक स्टोर की फ़ोटो',
      'அதிகாரப்பூர்வ கடைப் படம்',
      'ಅಧಿಕೃತ ಅಂಗಡಿ ಚಿತ್ರ',
    ),
    line: note(
      'A traditional preparation in the herbs & wellness range.',
      'ഹെർബ്സ് & വെൽനെസ് ശ്രേണിയിലെ പരമ്പരാഗത തയ്യാറാക്കൽ.',
      'हर्ब्स एंड वेलनेस रेंज में पारंपरिक तैयारी।',
      'ஹெர்ப்ஸ் & வெல்னெஸ் வரிசையில் பாரம்பரியத் தயாரிப்பு.',
      'ಹರ್ಬ್ಸ್ & ವೆಲ್ನೆಸ್ ಶ್ರೇಣಿಯ ಸಾಂಪ್ರದಾಯಿಕ ತಯಾರಿಕೆ.',
    ),
  },
];
