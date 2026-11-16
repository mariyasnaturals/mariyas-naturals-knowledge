/**
 * Phase 5 spotlights — real products, verified names, verified permalinks.
 *
 * MEDIA STATUS, stated honestly because it decides what each card renders:
 *
 * Two of these four have an authentic Mariyas .com photograph committed to this
 * repository (the baby-care range banner, which visibly shows the Baby Massage Oil
 * and Baby Hair Oil bottles). Those two cards show that photograph and label it as
 * the official range photograph — never as a per-SKU pack shot.
 *
 * The other two (Coconut Milk Shampoo, Chyavanaprash) have live .com product
 * photographs, but this build environment cannot download binary images from
 * mariyasnaturals.com (TLS is refused to the sandbox; `fetch_page` returns HTTP 500
 * for image URLs). Rather than substitute a different product's photo or generate
 * one, those two cards render a labelled, correctly sized photo slot and record the
 * exact source URL to import. See docs/reference/living-gallery/README.md.
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
  /** Live .com photograph to import when the owner runs the media import. */
  pendingPhotoUrl?: string;
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
    pendingPhotoUrl:
      'https://www.mariyasnaturals.com/wp-content/uploads/2026/11/coconut-shampoo-200ml-1.webp',
    line: note(
      'A 200 ml hair wash in the current catalogue.',
      'നിലവിലെ കാറ്റലോഗിലെ 200 ml ഹെയർ വാഷ്.',
      'मौजूदा कैटलॉग में 200 ml हेयर वॉश।',
      'தற்போதைய பட்டியலில் 200 ml ஹேர் வாஷ்.',
      'ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಲ್ಲಿ 200 ml ಹೇರ್ ವಾಶ್.',
    ),
    imageNote: note('', '', '', '', ''),
  },
  {
    id: 'baby-massage-oil',
    name: 'Baby Massage Oil 200 ml',
    href: 'https://www.mariyasnaturals.com/product/baby-massage-oil-200-ml/',
    storeProductId: 2866,
    localSlug: 'baby-massage-oil-200ml-19187',
    imageId: 'brand-in-3225',
    imageNote: note(
      'Official baby-care range photograph',
      'ഔദ്യോഗിക ബേബി കെയർ ശ്രേണിയുടെ ചിത്രം',
      'आधिकारिक बेबी केयर रेंज की फ़ोटो',
      'அதிகாரப்பூர்வ குழந்தை பராமரிப்பு வரிசைப் படம்',
      'ಅಧಿಕೃತ ಮಗು ಆರೈಕೆ ಶ್ರೇಣಿಯ ಫೋಟೋ',
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
    imageId: 'brand-in-3225',
    imageNote: note(
      'Official baby-care range photograph',
      'ഔദ്യോഗിക ബേബി കെയർ ശ്രേണിയുടെ ചിത്രം',
      'आधिकारिक बेबी केयर रेंज की फ़ोटो',
      'அதிகாரப்பூர்வ குழந்தை பராமரிப்பு வரிசைப் படம்',
      'ಅಧಿಕೃತ ಮಗು ಆರೈಕೆ ಶ್ರೇಣಿಯ ಫೋಟೋ',
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
    pendingPhotoUrl:
      'https://www.mariyasnaturals.com/wp-content/uploads/2026/11/Chyavanprash-1.webp',
    line: note(
      'A traditional preparation in the herbs & wellness range.',
      'ഹെർബ്സ് & വെൽനെസ് ശ്രേണിയിലെ പരമ്പരാഗത തയ്യാറാക്കൽ.',
      'हर्ब्स एंड वेलनेस रेंज में पारंपरिक तैयारी।',
      'ஹெர்ப்ஸ் & வெல்னெஸ் வரிசையில் பாரம்பரியத் தயாரிப்பு.',
      'ಹರ್ಬ್ಸ್ & ವೆಲ್ನೆಸ್ ಶ್ರೇಣಿಯ ಸಾಂಪ್ರದಾಯಿಕ ತಯಾರಿಕೆ.',
    ),
    imageNote: note('', '', '', '', ''),
  },
];
