/**
 * Copy for the "Mariyas Living Product Gallery" system.
 *
 * Every string here is original interface copy written for this site. Nothing is
 * copied from the marketplace questionnaire that inspired the interaction pattern.
 * Keeping it in one typed module (rather than the legacy JSON dictionaries) means
 * the new system can be read, reviewed and translated as a single unit.
 *
 * Copy rules that hold throughout:
 *   - no medical or curative claims; cosmetic/herbal framing only
 *   - no invented review counts, ratings, prices or certifications
 *   - no promise a product will "fix" a condition
 */
import type { Locale } from '../i18n';

export type Localized = Record<Locale, string>;

export const livingNav: Record<
  Locale,
  {
    /** Desktop nav label — speaks the tool's full name. */
    ritual: string;
    /** Mobile bottom-bar label — must stay short enough for a quarter cell. */
    ritualShort: string;
    collections: string;
    story: string;
    catalogue: string;
  }
> = {
  en: {
    ritual: 'Ritual Finder',
    ritualShort: 'My Ritual',
    collections: 'Collections',
    story: 'Our story',
    catalogue: 'Catalogue',
  },
  ml: {
    ritual: 'റിച്വൽ ഫൈൻഡർ',
    ritualShort: 'എന്റെ പരിചരണം',
    collections: 'ശേഖരങ്ങൾ',
    story: 'ഞങ്ങളുടെ കഥ',
    catalogue: 'കാറ്റലോഗ്',
  },
  hi: {
    ritual: 'रिचुअल फाइंडर',
    ritualShort: 'मेरा रिचुअल',
    collections: 'संग्रह',
    story: 'हमारी कहानी',
    catalogue: 'कैटलॉग',
  },
  ta: {
    ritual: 'ரிட்டுவல் ஃபைண்டர்',
    ritualShort: 'என் ரிட்டுவல்',
    collections: 'தொகுப்புகள்',
    story: 'எங்கள் கதை',
    catalogue: 'பட்டியல்',
  },
  kn: {
    ritual: 'ರಿಚುಯಲ್ ಫೈಂಡರ್',
    ritualShort: 'ನನ್ನ ರಿಚುಯಲ್',
    collections: 'ಸಂಗ್ರಹಗಳು',
    story: 'ನಮ್ಮ ಕಥೆ',
    catalogue: 'ಪಟ್ಟಿ',
  },
};

/* ------------------------------------------------------ ritual feature cards -- */

export const ritualCards = {
  eyebrow: {
    en: 'SIGNATURE HAIR OIL',
    ml: 'സിഗ്നേച്ചർ ഹെയർ ഓയിൽ',
    hi: 'सिग्नेचर हेयर ऑयल',
    ta: 'சிக்னேச்சர் ஹேர் ஆயில்',
    kn: 'ಸಿಗ್ನೇಚರ್ ಹೇರ್ ಆಯಿಲ್',
  } as Localized,
  label: {
    en: '01 / THE TWO EDITIONS',
    ml: '01 / രണ്ട് അളവുകൾ',
    hi: '01 / दो आकार',
    ta: '01 / இரண்டு அளவுகள்',
    kn: '01 / ಎರಡು ಆವೃತ್ತಿಗಳು',
  } as Localized,
  title: {
    en: 'Discover Your Mariyas Ritual',
    ml: 'നിങ്ങളുടെ മരിയാസ് പരിചരണം കണ്ടെത്തൂ',
    hi: 'अपना मरियास रिचुअल खोजें',
    ta: 'உங்கள் மரியாஸ் ரிட்டுவலைக் கண்டறியுங்கள்',
    kn: 'ನಿಮ್ಮ ಮರಿಯಾಸ್ ರಿಚುಯಲ್ ಕಂಡುಕೊಳ್ಳಿ',
  } as Localized,
  note: {
    en: 'Two packs of the same herbal hair care oil. Choose the size that fits how often you oil your hair.',
    ml: 'ഒരേ ഹെർബൽ ഹെയർ കെയർ ഓയിലിന്റെ രണ്ട് പായ്ക്കുകൾ. എത്ര തവണ എണ്ണ ഉപയോഗിക്കുന്നു എന്നതിന് അനുയോജ്യമായ അളവ് തിരഞ്ഞെടുക്കൂ.',
    hi: 'एक ही हर्बल हेयर केयर ऑयल के दो पैक। जितनी बार आप तेल लगाते हैं, उसके अनुसार आकार चुनें।',
    ta: 'ஒரே ஹெர்பல் ஹேர் கேர் ஆயிலின் இரண்டு பொதிகள். எத்தனை முறை எண்ணெய் பயன்படுத்துகிறீர்கள் என்பதற்கு ஏற்ற அளவைத் தேர்ந்தெடுங்கள்.',
    kn: 'ಅದೇ ಹೆರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್‌ನ ಎರಡು ಪ್ಯಾಕ್‌ಗಳು. ನೀವು ಎಷ್ಟು ಬಾರಿ ಎಣ್ಣೆ ಹಚ್ಚುತ್ತೀರಿ ಎಂಬುದಕ್ಕೆ ಸರಿಹೊಂದುವ ಗಾತ್ರ ಆರಿಸಿ.',
  } as Localized,
  /*
   * The owner confirmed on 2026-11-16 that the 500 ml pack ships with a free
   * oil-treated neem comb, and asked for the word FREE to appear.
   *
   * NOTE FOR WHOEVER MAINTAINS THE STORE: the live .com product page for the
   * 500 ml pack still describes the oil only and shows no comb offer. The pack
   * photos do not show a comb either; the comb is visible only in the 200 ml
   * listing photo. Until the store page states the offer, customers read it here
   * and then do not see it at checkout. Do not silently repoint this card at a
   * different SKU to paper over that mismatch.
   */
  combBadgeFree: {
    en: 'FREE',
    ml: 'സൗജന്യം',
    hi: 'मुफ़्त',
    ta: 'இலவசம்',
    kn: 'ಉಚಿತ',
  } as Localized,
  combBadge: {
    en: 'OIL-TREATED NEEM COMB',
    ml: 'എണ്ണയിൽ സംസ്കരിച്ച നീം ചീർപ്പ്',
    hi: 'तेल-उपचारित नीम कंघी',
    ta: 'எண்ணெய் பதப்படுத்திய வேப்பம் சீப்பு',
    kn: 'ಎಣ್ಣೆ ಸಂಸ್ಕರಿಸಿದ ಬೇವು ಬಾಚಣಿಗೆ',
  } as Localized,
  combNote: {
    en: 'Get an Oil-Treated Neem Comb FREE with your Mariyas Herbal Hair Care Oil 500 ml purchase.',
    ml: 'മരിയാസ് ഹെർബൽ ഹെയർ കേയർ ഓയിൽ 500 മില്ലി വാങ്ങുമ്പോൾ എണ്ണയിൽ സംസ്കരിച്ച നീം ചീർപ്പ് സൗജന്യമായി ലഭിക്കും.',
    hi: 'मरियास हर्बल हेयर केयर ऑयल 500 ml खरीदने पर तेल-उपचारित नीम कंघी मुफ़्त पाएं।',
    ta: 'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயில் 500 மிலி வாங்கினால் எண்ணெய் பதப்படுத்திய வேப்பம் சீப்பு இலவசம்.',
    kn: 'ಮರಿಯಾಸ್ ಹೆರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್ 500 ಮಿಲಿ ಖರೀದಿಸಿದಾಗ ಎಣ್ಣೆ ಸಂಸ್ಕರಿಸಿದ ಬೇವು ಬಾಚಣಿಗೆ ಉಚಿತ.',
  } as Localized,
  shop: {
    en: 'Shop on Official Store',
    ml: 'ഔദ്യോഗിക സ്റ്റോറിൽ വാങ്ങൂ',
    hi: 'आधिकारिक स्टोर पर खरीदें',
    ta: 'அதிகாரப்பூர்வ கடையில் வாங்குங்கள்',
    kn: 'ಅಧಿಕೃತ ಅಂಗಡಿಯಲ್ಲಿ ಖರೀದಿಸಿ',
  } as Localized,
  photoCaption: {
    en: 'Official .com product photo',
    ml: 'ഔദ്യോഗിക .com ഉൽപ്പന്ന ചിത്രം',
    hi: 'आधिकारिक .com उत्पाद फ़ोटो',
    ta: 'அதிகாரப்பூர்வ .com தயாரிப்புப் படம்',
    kn: 'ಅಧಿಕೃತ .com ಉತ್ಪನ್ನ ಫೋಟೋ',
  } as Localized,
  prev: {
    en: 'Previous edition',
    ml: 'മുമ്പത്തെ അളവ്',
    hi: 'पिछला आकार',
    ta: 'முந்தைய அளவு',
    kn: 'ಹಿಂದಿನ ಆವೃತ್ತಿ',
  } as Localized,
  next: {
    en: 'Next edition',
    ml: 'അടുത്ത അളവ്',
    hi: 'अगला आकार',
    ta: 'அடுத்த அளவு',
    kn: 'ಮುಂದಿನ ಆವೃತ್ತಿ',
  } as Localized,
  slideLabel: {
    en: 'Hair oil editions',
    ml: 'ഹെയർ ഓയിൽ അളവുകൾ',
    hi: 'हेयर ऑयल के आकार',
    ta: 'ஹேர் ஆயில் அளவுகள்',
    kn: 'ಹೇರ್ ಆಯಿಲ್ ಆವೃತ್ತಿಗಳು',
  } as Localized,
};

/* --------------------------------------------------------------- spotlights -- */

export const spotlights = {
  label: {
    en: '02 / DAILY CARE SPOTLIGHT',
    ml: '02 / ദൈനംദിന പരിചരണം',
    hi: '02 / रोज़ की देखभाल',
    ta: '02 / அன்றாடப் பராமரிப்பு',
    kn: '02 / ದಿನನಿತ್ಯದ ಆರೈಕೆ',
  } as Localized,
  title: {
    en: 'Daily Care Spotlight',
    ml: 'ദൈനംദിന പരിചരണം',
    hi: 'रोज़मर्रा की देखभाल',
    ta: 'அன்றாடப் பராமரிப்பு',
    kn: 'ದಿನನಿತ್ಯದ ಆರೈಕೆ',
  } as Localized,
  note: {
    en: 'Four everyday products from the current Mariyas collection, with the wording the official store uses for each format.',
    ml: 'നിലവിലെ മരിയാസ് ശേഖരത്തിലെ നാല് ദൈനംദിന ഉൽപ്പന്നങ്ങൾ.',
    hi: 'मौजूदा मरियास संग्रह के चार रोज़मर्रा के उत्पाद।',
    ta: 'தற்போதைய மரியாஸ் தொகுப்பின் நான்கு அன்றாட தயாரிப்புகள்.',
    kn: 'ಪ್ರಸುತ್ತ ಮರಿಯಾಸ್ ಸಂಗ್ರಹದ ನಾಲ್ಕು ದಿನನಿತ್ಯದ ಉತ್ಪನ್ನಗಳು.',
  } as Localized,
  view: {
    en: 'View on official store',
    ml: 'ഔദ്യോഗിക സ്റ്റോറിൽ കാണുക',
    hi: 'आधिकारिक स्टोर पर देखें',
    ta: 'அதிகாரப்பூர்வ கடையில் பார்க்க',
    kn: 'ಅಧಿಕೃತ ಅಂಗಡಿಯಲ್ಲಿ ನೋಡಿ',
  } as Localized,
  pendingPhoto: {
    en: 'Photo slot ready for the official .com image',
    ml: 'ഔദ്യോഗിക .com ചിത്രത്തിനായി ഇടം തയ്യാർ',
    hi: 'आधिकारिक .com छवि के लिए स्थान तैयार',
    ta: 'அதிகாரப்பூர்வ .com படத்திற்கான இடம் தயார்',
    kn: 'ಅಧಿಕೃತ .com ಚಿತ್ರಕ್ಕೆ ಸ್ಥಳ ಸಿದ್ಧ',
  } as Localized,
  photoLabel: {
    en: 'Official category photograph',
    ml: 'ഔദ്യോഗിക വിഭാഗ ചിത്രം',
    hi: 'आधिकारिक श्रेणी फ़ोटो',
    ta: 'அதிகாரப்பூர்வ வகைப் படம்',
    kn: 'ಅಧಿಕೃತ ವರ್ಗದ ಫೋಟೋ',
  } as Localized,
  rail: {
    en: 'Care spotlights',
    ml: 'പരിചരണ ഉൽപ്പന്നങ്ങൾ',
    hi: 'देखभाल उत्पाद',
    ta: 'பராமரிப்பு தயாரிப்புகள்',
    kn: 'ಆರೈಕೆ ಉತ್ಪನ್ನಗಳು',
  } as Localized,
};

/* ------------------------------------------------------------ care explorer -- */

export const careExplorer = {
  label: {
    en: '03 / EXPLORE BY CARE',
    ml: '03 / പരിചരണം അനുസരിച്ച്',
    hi: '03 / देखभाल के अनुसार',
    ta: '03 / பராமரிப்பு வாரியாக',
    kn: '03 / ಆರೈಕೆ ಪ್ರಕಾರ',
  } as Localized,
  title: {
    en: 'Explore by Care',
    ml: 'പരിചരണം അനുസരിച്ച് കാണൂ',
    hi: 'देखभाल के अनुसार देखें',
    ta: 'பராமரிப்பு வாரியாகப் பாருங்கள்',
    kn: 'ಆರೈಕೆ ಪ್ರಕಾರ ನೋಡಿ',
  } as Localized,
  note: {
    // The count matches the tiles actually rendered (six care groups), so the
    // sentence can never disagree with the grid.
    en: 'Six ways into the collection. Every product still has its own page in the full catalogue.',
    ml: 'ശേഖരത്തിലേക്കുള്ള ആറ് വഴികൾ. ഓരോ ഉൽപ്പന്നത്തിനും കാറ്റലോഗിൽ സ്വന്തം പേജുണ്ട്.',
    hi: 'संग्रह के छह द्वार। हर उत्पाद का पूरे कैटलॉग में अपना पेज है।',
    ta: 'தொகுப்பிற்குள் ஆறு வழிகள். ஒவ்வொரு தயாரிப்புக்கும் முழு பட்டியலில் தனிப் பக்கம் உண்டு.',
    kn: 'ಸಂಗ್ರಹಕ್ಕೆ ಆರು ದಾರಿಗಳು. ಪ್ರತಿ ಉತ್ಪನ್ನಕ್ಕೂ ಪೂರ್ಣ ಪಟ್ಟಿಯಲ್ಲಿ ತನ್ನದೇ ಪುಟವಿದೆ.',
  } as Localized,
  count: {
    en: 'products in the current catalogue',
    ml: 'നിലവിലെ കാറ്റലോഗിലെ ഉൽപ്പന്നങ്ങൾ',
    hi: 'मौजूदा कैटलॉग में उत्पाद',
    ta: 'தற்போதைய பட்டியலில் தயாரிப்புகள்',
    kn: 'ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಲ್ಲಿ ಉತ್ಪನ್ನಗಳು',
  } as Localized,
};

/* ------------------------------------------------------------- testimonials -- */

export const voices = {
  label: {
    en: '04 / WHAT CUSTOMERS SAY',
    ml: '04 / ഉപഭോക്താക്കൾ പറയുന്നത്',
    hi: '04 / ग्राहक क्या कहते हैं',
    ta: '04 / வாடிக்கையாளர்கள் சொல்வது',
    kn: '04 / ಗ್ರಾಹಕರು ಹೇಳುವುದು',
  } as Localized,
  title: {
    en: 'Customer voices',
    ml: 'ഉപഭോക്തൃ ശബ്ദങ്ങൾ',
    hi: 'ग्राहकों की आवाज़',
    ta: 'வாடிக்கையாளர் குரல்கள்',
    kn: 'ಗ್ರಾಹಕರ ಧ್ವನಿಗಳು',
  } as Localized,
  note: {
    en: 'Customers review Mariyas Naturals on our Google Business Profile. The rating below is the figure that listing showed when we last checked.',
    ml: 'ഉപഭോക്താക്കൾ മരിയാസ് നാച്ചുറൽസിനെ Google ബിസിനസ് പ്രൊഫൈലിൽ അവലോകനം ചെയ്യുന്നു. താഴെയുള്ള റേറ്റിംഗ് ഞങ്ങൾ അവസാനം പരിശോധിച്ചപ്പോൾ ആ ലിസ്റ്റിംഗിൽ കണ്ട കണക്കാണ്.',
    hi: 'ग्राहक मरियास नेचुरल्स की समीक्षा हमारी Google बिज़नेस प्रोफ़ाइल पर करते हैं। नीचे दी रेटिंग वही है जो उस लिस्टिंग में हमारे अंतिम जाँच के समय दिखी थी।',
    ta: 'வாடிக்கையாளர்கள் மரியாஸ் நேச்சுரல்ஸை Google வணிகச் சுயவிவரத்தில் மதிப்பிடுகின்றனர். கீழே உள்ள மதிப்பீடு நாங்கள் கடைசியாகப் பார்த்தபோது அந்தப் பட்டியலில் இருந்ததே.',
    kn: 'ಗ್ರಾಹಕರು ಮರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಅನ್ನು ನಮ್ಮ Google ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ವಿಮರ್ಶಿಸುತ್ತಾರೆ. ಕೆಳಗಿನ ರೇಟಿಂಗ್ ನಾವು ಕೊನೆಯದಾಗಿ ಪರಿಶೀಲಿಸಿದಾಗ ಆ ಪಟ್ಟಿಯಲ್ಲಿ ಕಂಡ ಸಂಖ್ಯೆ.',
  } as Localized,
  ratingTemplate: {
    en: '{rating} ★ | {count} Google reviews',
    ml: '{rating} ★ | {count} Google അവലോകനങ്ങൾ',
    hi: '{rating} ★ | {count} Google समीक्षाएँ',
    ta: '{rating} ★ | {count} Google மதிப்புரைகள்',
    kn: '{rating} ★ | {count} Google ವಿಮರ್ಶೆಗಳು',
  } as Localized,
  ratingAsOf: {
    en: 'as shown on Google on {date}',
    ml: 'Google-ൽ {date}-ന് കാണിച്ചത് പ്രകാരം',
    hi: 'Google पर {date} को दिखाया गया',
    ta: 'Google-இல் {date} அன்று காட்டியபடி',
    kn: 'Google ನಲ್ಲಿ {date} ರಂದು ತೋರಿಸಿದಂತೆ',
  } as Localized,
  viewOnGoogle: {
    en: 'View reviews on Google',
    ml: 'Google-ൽ അവലോകനങ്ങൾ കാണൂ',
    hi: 'Google पर समीक्षाएँ देखें',
    ta: 'Google-இல் மதிப்புரைகளைப் பார்க்க',
    kn: 'Google ನಲ್ಲಿ ವಿಮರ್ಶೆಗಳನ್ನು ನೋಡಿ',
  } as Localized,
  cardPendingTitle: {
    en: 'Review text pending',
    ml: 'അഭിപ്രായ വാചകം കാത്തിരിക്കുന്നു',
    hi: 'समीक्षा पाठ प्रतीक्षित',
    ta: 'மதிப்புரை உரை காத்திருக்கிறது',
    kn: 'ವಿಮರ್ಶೆ ಪಠ್ಯ ಬಾಕಿ',
  } as Localized,
  emptyTitle: {
    en: 'Verified reviews pending',
    ml: 'സ്ഥിരീകരിച്ച അഭിപ്രായങ്ങൾ കാത്തിരിക്കുന്നു',
    hi: 'सत्यापित समीक्षाएँ प्रतीक्षित',
    ta: 'உறுதிப்படுத்தப்பட்ட மதிப்புரைகள் காத்திருக்கின்றன',
    kn: 'ದೃಢೀಕೃತ ವಿಮರ್ಶೆಗಳು ಬಾಕಿ',
  } as Localized,
  emptyBody: {
    en: 'Individual review text is published only once the owner approves the exact wording for republication. Until then, the rating links straight to the live listing so you can read every review at source.',
    ml: 'കൃത്യമായ Google ബിസിനസ് പ്രൊഫൈൽ ഉടമ സ്ഥിരീകരിച്ച് വാചകം അംഗീകരിച്ചതിന് ശേഷം മാത്രമേ റേറ്റിംഗോ അഭിപ്രായങ്ങളോ പ്രസിദ്ധീകരിക്കൂ.',
    hi: 'रेटिंग, समीक्षा संख्या या समीक्षा पाठ तभी प्रकाशित होगा जब मालिक सटीक Google बिज़नेस प्रोफ़ाइल की पुष्टि और शब्दों की स्वीकृति दें।',
    ta: 'சரியான Google வணிகச் சுயவிவரத்தை உரிமையாளர் உறுதிப்படுத்தி, வாசகத்தை அனுமதித்த பிறகே மதிப்பீடோ மதிப்புரையோ வெளியிடப்படும்.',
    kn: 'ನಿಖರವಾದ Google ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಮಾಲೀಕರು ದೃಢೀಕರಿಸಿ, ಪಠ್ಯಕ್ಕೆ ಅನುಮೋದನೆ ನೀಡಿದ ನಂತರವೇ ರೇಟಿಂಗ್ ಅಥವಾ ವಿಮರ್ಶೆ ಪ್ರಕಟವಾಗುತ್ತದೆ.',
  } as Localized,
  socialPending: {
    en: 'Official Instagram and Facebook pages',
    ml: 'ഔദ്യോഗിക ഇൻസ്റ്റാഗ്രാം, ഫേസ്ബുക്ക് പേജുകൾ',
    hi: 'आधिकारिक इंस्टाग्राम और फ़ेसबुक पेज',
    ta: 'அதிகாரப்பூர்வ இன்ஸ்டாகிராம், பேஸ்புக் பக்கங்கள்',
    kn: 'ಅಧಿಕೃತ ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್, ಫೇಸ್‌ಬುಕ್ ಪುಟಗಳು',
  } as Localized,
};

/** Rail controls shared by the edition, spotlight and voice carousels. */
export const railLabels = {
  prev: {
    en: 'Previous',
    ml: 'മുമ്പത്തേത്',
    hi: 'पिछला',
    ta: 'முந்தையது',
    kn: 'ಹಿಂದಿನದು',
  } as Localized,
  next: {
    en: 'Next',
    ml: 'അടുത്തത്',
    hi: 'अगला',
    ta: 'அடுத்தது',
    kn: 'ಮುಂದಿನದು',
  } as Localized,
  slideLabel: {
    en: 'Customer review slots',
    ml: 'ഉപഭോക്തൃ അവലോകന സ്ലോട്ടുകൾ',
    hi: 'ग्राहक समीक्षा स्लॉट',
    ta: 'வாடிக்கையாளர் மதிப்புரை இடங்கள்',
    kn: 'ಗ್ರಾಹಕ ವಿಮರ್ಶೆ ಸ್ಲಾಟ್‌ಗಳು',
  } as Localized,
};

/* ------------------------------------------------------------------- footer -- */

export const footerCopy: Record<
  Locale,
  {
    tagline: string;
    addressLabel: string;
    address: string;
    emailLabel: string;
    whatsappLabel: string;
    whatsappHint: string;
    mapsLabel: string;
    /** Text of the Maps link itself, e.g. "Find us on Google Maps". */
    mapsFindUs: string;
    mapsPending: string;
    socialLabel: string;
    collectionsLabel: string;
    legalLabel: string;
    legal: string[];
    rights: string;
    storeNote: string;
    instagram: string;
    facebook: string;
  }
> = {
  en: {
    tagline: 'Botanicals. Heritage. Thoughtful care.',
    addressLabel: 'Visit',
    address:
      'Mariyas, 4/625 Kalath Ward, Thalavady South S.O, Avalookkunnu P.O, Alappuzha – 688006, Kerala',
    emailLabel: 'Email',
    whatsappLabel: 'WhatsApp',
    whatsappHint: 'Orders, product questions and delivery help',
    mapsLabel: 'Google Maps',
    mapsFindUs: 'Find us on Google Maps',
    mapsPending: 'Listing link to be confirmed',
    socialLabel: 'Follow',
    collectionsLabel: 'Collections',
    legalLabel: 'Site information',
    legal: [
      'Purchases are completed on mariyasnaturals.com',
      'Preview build for owner review',
      'Herbal cosmetics, not medicines',
    ],
    rights: 'All rights reserved.',
    storeNote:
      'This is a discovery site. Carts, payments and delivery are handled only on the official store.',
    instagram: 'Instagram',
    facebook: 'Facebook',
  },
  ml: {
    tagline: 'സസ്യങ്ങൾ. പാരമ്പര്യം. കരുതലുള്ള പരിചരണം.',
    addressLabel: 'വിലാസം',
    address:
      'മരിയാസ്, 4/625 കാലത്ത് വാർഡ്, തലവടി സൗത്ത് എസ്.ഒ, അവലൂക്കുന്ന് പി.ഒ, ആലപ്പുഴ – 688006, കേരളം',
    emailLabel: 'ഇമെയിൽ',
    whatsappLabel: 'വാട്ട്സ്ആപ്പ്',
    whatsappHint: 'ഓർഡർ, ഉൽപ്പന്ന സംശയങ്ങൾ, ഡെലിവറി സഹായം',
    mapsLabel: 'ഗൂഗിൾ മാപ്സ്',
    mapsFindUs: 'Google Maps-ൽ ഞങ്ങളെ കാണൂ',
    mapsPending: 'ലിങ്ക് സ്ഥിരീകരിക്കാനുണ്ട്',
    socialLabel: 'പിന്തുടരൂ',
    collectionsLabel: 'ശേഖരങ്ങൾ',
    legalLabel: 'സൈറ്റ് വിവരങ്ങൾ',
    legal: [
      'വാങ്ങൽ mariyasnaturals.com-ൽ പൂർത്തിയാകുന്നു',
      'ഉടമ അവലോകനത്തിനുള്ള പ്രിവ്യൂ ബിൽഡ്',
      'ഹെർബൽ കോസ്മെറ്റിക്സ്, മരുന്നുകളല്ല',
    ],
    rights: 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
    storeNote:
      'ഇത് ഒരു അറിവ് വെബ്സൈറ്റാണ്. കാർട്ട്, പേയ്മെന്റ്, ഡെലിവറി എന്നിവ ഔദ്യോഗിക സ്റ്റോറിൽ മാത്രം.',
    instagram: 'ഇൻസ്റ്റാഗ്രാം',
    facebook: 'ഫേസ്ബുക്ക്',
  },
  hi: {
    tagline: 'वनस्पतियाँ। विरासत। विचारपूर्ण देखभाल।',
    addressLabel: 'पता',
    address:
      'मरियास, 4/625 कालथ वार्ड, थलवाडी साउथ एस.ओ, अवलूक्कुन्नु पी.ओ, अलप्पुझा – 688006, केरल',
    emailLabel: 'ईमेल',
    whatsappLabel: 'व्हाट्सएप',
    whatsappHint: 'ऑर्डर, उत्पाद प्रश्न और डिलीवरी सहायता',
    mapsLabel: 'गूगल मैप्स',
    mapsFindUs: 'Google Maps पर हमें खोजें',
    mapsPending: 'लिंक की पुष्टि बाकी',
    socialLabel: 'फ़ॉलो करें',
    collectionsLabel: 'संग्रह',
    legalLabel: 'साइट जानकारी',
    legal: [
      'खरीदारी mariyasnaturals.com पर पूरी होती है',
      'मालिक समीक्षा के लिए प्रीव्यू बिल्ड',
      'हर्बल कॉस्मेटिक्स, दवाइयाँ नहीं',
    ],
    rights: 'सर्वाधिकार सुरक्षित।',
    storeNote:
      'यह एक जानकारी साइट है। कार्ट, भुगतान और डिलीवरी केवल आधिकारिक स्टोर पर।',
    instagram: 'इंस्टाग्राम',
    facebook: 'फ़ेसबुक',
  },
  ta: {
    tagline: 'தாவரங்கள். மரபு. அக்கறையான பராமரிப்பு.',
    addressLabel: 'முகவரி',
    address:
      'மரியாஸ், 4/625 காலத் வார்டு, தலவாடி சவுத் எஸ்.ஓ, அவலூக்குன்னு பி.ஓ, ஆலப்புழா – 688006, கேரளா',
    emailLabel: 'மின்னஞ்சல்',
    whatsappLabel: 'வாட்ஸ்அப்',
    whatsappHint: 'ஆர்டர், தயாரிப்பு கேள்விகள், டெலிவரி உதவி',
    mapsLabel: 'கூகிள் மேப்ஸ்',
    mapsFindUs: 'Google Maps-இல் எங்களைக் காணுங்கள்',
    mapsPending: 'இணைப்பு உறுதிப்படுத்தப்பட வேண்டும்',
    socialLabel: 'பின்தொடரவும்',
    collectionsLabel: 'தொகுப்புகள்',
    legalLabel: 'தளத் தகவல்',
    legal: [
      'வாங்குதல் mariyasnaturals.com இல் நிறைவடைகிறது',
      'உரிமையாளர் மதிப்பாய்வுக்கான முன்னோட்டம்',
      'ஹெர்பல் அழகுசாதனப் பொருட்கள், மருந்துகள் அல்ல',
    ],
    rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    storeNote:
      'இது ஒரு தகவல் தளம். கார்ட், பணம் செலுத்துதல், டெலிவரி அதிகாரப்பூர்வ கடையில் மட்டுமே.',
    instagram: 'இன்ஸ்டாகிராம்',
    facebook: 'பேஸ்புக்',
  },
  kn: {
    tagline: 'ಗಿಡಮೂಲಿಕೆಗಳು. ಪರಂಪರೆ. ಆಲೋಚನಾಶೀಲ ಆರೈಕೆ.',
    addressLabel: 'ವಿಳಾಸ',
    address:
      'ಮರಿಯಾಸ್, 4/625 ಕಾಲತ್ ವಾರ್ಡ್, ತಲವಾಡಿ ಸೌತ್ ಎಸ್.ಒ, ಅವಲೂಕ್ಕನ್ನು ಪಿ.ಒ, ಆಲಪ್ಪುಳ – 688006, ಕೇರಳ',
    emailLabel: 'ಇಮೇಲ್',
    whatsappLabel: 'ವಾಟ್ಸಪ್',
    whatsappHint: 'ಆರ್ಡರ್, ಉತ್ಪನ್ನ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಡೆಲಿವರಿ ಸಹಾಯ',
    mapsLabel: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್',
    mapsFindUs: 'Google Maps ನಲ್ಲಿ ನಮ್ಮನ್ನು ಹುಡುಕಿ',
    mapsPending: 'ಲಿಂಕ್ ದೃಢೀಕರಣ ಬಾಕಿ',
    socialLabel: 'ಅನುಸರಿಸಿ',
    collectionsLabel: 'ಸಂಗ್ರಹಗಳು',
    legalLabel: 'ಸೈಟ್ ಮಾಹಿತಿ',
    legal: [
      'ಖರೀದಿ mariyasnaturals.com ನಲ್ಲಿ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ',
      'ಮಾಲೀಕರ ಪರಿಶೀಲನೆಗಾಗಿ ಪೂರ್ವವೀಕ್ಷಣೆ',
      'ಹೆರ್ಬಲ್ ಸೌಂದರ್ಯವರ್ಧಕಗಳು, ಔಷಧಿಗಳಲ್ಲ',
    ],
    rights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    storeNote:
      'ಇದು ಮಾಹಿತಿ ಸೈಟ್. ಕಾರ್ಟ್, ಪಾವತಿ ಮತ್ತು ಡೆಲಿವರಿ ಅಧಿಕೃತ ಅಂಗಡಿಯಲ್ಲಿ ಮಾತ್ರ.',
    instagram: 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್',
    facebook: 'ಫೇಸ್‌ಬುಕ್',
  },
};

/* ------------------------------------------------- language suggestion + CTA -- */

export const languageHint = {
  question: {
    en: 'Would you like to view this site in {language}?',
    ml: 'ഈ സൈറ്റ് {language} ഭാഷയിൽ കാണണോ?',
    hi: 'क्या आप यह साइट {language} में देखना चाहेंगे?',
    ta: 'இந்தத் தளத்தை {language} மொழியில் பார்க்க விரும்புகிறீர்களா?',
    kn: 'ಈ ಸೈಟ್ ಅನ್ನು {language} ನಲ್ಲಿ ನೋಡಲು ಬಯಸುವಿರಾ?',
  } as Localized,
  accept: {
    en: 'View in {language}',
    ml: '{language} ഭാഷയിൽ കാണുക',
    hi: '{language} में देखें',
    ta: '{language} மொழியில் பார்',
    kn: '{language} ನಲ್ಲಿ ನೋಡಿ',
  } as Localized,
  dismiss: {
    en: 'Not now',
    ml: 'ഇപ്പോൾ വേണ്ട',
    hi: 'अभी नहीं',
    ta: 'இப்போது வேண்டாம்',
    kn: 'ಈಗ ಬೇಡ',
  } as Localized,
  close: {
    en: 'Close language suggestion',
    ml: 'ഭാഷാ നിർദ്ദേശം അടയ്ക്കുക',
    hi: 'भाषा सुझाव बंद करें',
    ta: 'மொழி பரிந்துரையை மூடு',
    kn: 'ಭಾಷಾ ಸಲಹೆ ಮುಚ್ಚಿ',
  } as Localized,
};

export const ritualCta = {
  label: {
    en: '05 / YOUR NATURE. YOUR RITUAL.',
    ml: '05 / നിങ്ങളുടെ സ്വഭാവം. നിങ്ങളുടെ പരിചരണം.',
    hi: '05 / आपकी प्रकृति। आपका रिचुअल।',
    ta: '05 / உங்கள் இயல்பு. உங்கள் ரிட்டுவல்.',
    kn: '05 / ನಿಮ್ಮ ಸ್ವಭಾವ. ನಿಮ್ಮ ರಿಚುಯಲ್.',
  } as Localized,
  title: {
    en: 'Not sure where to begin?',
    ml: 'എവിടെ നിന്ന് തുടങ്ങണമെന്ന് ഉറപ്പില്ലേ?',
    hi: 'समझ नहीं आ रहा कहाँ से शुरू करें?',
    ta: 'எங்கு தொடங்குவது என்று தெரியவில்லையா?',
    kn: 'ಎಲ್ಲಿ ಪ್ರಾರಂಭಿಸಬೇಕು ಎಂದು ಖಚಿತವಿಲ್ಲವೇ?',
  } as Localized,
  text: {
    en: 'Answer a few short questions and we will suggest one to three products from the current catalogue, with a reason for each.',
    ml: 'കുറച്ച് ചെറിയ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകൂ, നിലവിലെ കാറ്റലോഗിൽ നിന്ന് ഒന്ന് മുതൽ മൂന്ന് വരെ ഉൽപ്പന്നങ്ങൾ ഓരോന്നിനും കാരണത്തോടെ ഞങ്ങൾ നിർദ്ദേശിക്കും.',
    hi: 'कुछ छोटे प्रश्नों के उत्तर दें, हम मौजूदा कैटलॉग से एक से तीन उत्पाद सुझाएँगे, हर एक के कारण के साथ।',
    ta: 'சில சிறிய கேள்விகளுக்குப் பதிலளியுங்கள்; தற்போதைய பட்டியலிலிருந்து ஒன்று முதல் மூன்று வரை தயாரிப்புகளைக் காரணத்துடன் பரிந்துரைப்போம்.',
    kn: 'ಕೆಲವು ಸಣ್ಣ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ; ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಿಂದ ಒಂದರಿಂದ ಮೂರರವರೆಗೆ ಉತ್ಪನ್ನಗಳನ್ನು ಕಾರಣದೊಂದಿಗೆ ಸೂಚಿಸುತ್ತೇವೆ.',
  } as Localized,
  action: {
    en: 'Open the Ritual Finder',
    ml: 'റിച്വൽ ഫൈൻഡർ തുറക്കൂ',
    hi: 'रिचुअल फाइंडर खोलें',
    ta: 'ரிட்டுவல் ஃபைண்டரைத் திற',
    kn: 'ರಿಚುಯಲ್ ಫೈಂಡರ್ ತೆರೆಯಿರಿ',
  } as Localized,
  disclaimer: {
    en: 'Guidance only, based on what you tell us. Herbal cosmetics are not medicines — for a medical concern, please speak to a qualified practitioner.',
    ml: 'നിങ്ങൾ പറയുന്നതിന്റെ അടിസ്ഥാനത്തിലുള്ള നിർദ്ദേശം മാത്രം. ഹെർബൽ കോസ്മെറ്റിക്സ് മരുന്നുകളല്ല — ആരോഗ്യപ്രശ്നങ്ങൾക്ക് യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കൂ.',
    hi: 'केवल आपकी जानकारी के आधार पर मार्गदर्शन। हर्बल कॉस्मेटिक्स दवाइयाँ नहीं हैं — किसी चिकित्सकीय चिंता के लिए योग्य चिकित्सक से मिलें।',
    ta: 'நீங்கள் தரும் தகவலின் அடிப்படையில் வழிகாட்டுதல் மட்டுமே. ஹெர்பல் அழகுசாதனப் பொருட்கள் மருந்துகள் அல்ல — மருத்துவக் கவலைக்கு தகுதியான மருத்துவரை அணுகுங்கள்.',
    kn: 'ನೀವು ನೀಡುವ ಮಾಹಿತಿಯ ಆಧಾರದಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ಹೆರ್ಬಲ್ ಸೌಂದರ್ಯವರ್ಧಕಗಳು ಔಷಧಿಗಳಲ್ಲ — ವೈದ್ಯಕೀಯ ಕಾಳಜಿಗೆ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  } as Localized,
};
