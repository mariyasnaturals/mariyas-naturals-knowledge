/**
 * MARIYAS RITUAL FINDER — recommendation configuration.
 *
 * This file is the whole "engine". The questionnaire UI reads these arrays and
 * the recommender in `ritual-engine.ts` scores the catalogue against the chosen
 * answers with plain rules. There is no model, no network call, no AI API and no
 * hidden weighting: every point awarded is written here, and every product is a
 * real catalogue entry with a verified permalink.
 *
 * Editorial rules baked into the shape of this data:
 *   - questions are about FORMAT, ROUTINE and PREFERENCE, never diagnosis
 *   - no question promises a cure, and no answer label is a medical claim
 *   - reasons are always phrased as "why this suits what you told us"
 *   - testimonials, ratings and scarcity are never generated
 */

import { isPubliclyVisible } from './product-visibility';
import type { Locale } from '../i18n';
import type { Localized } from './living-copy';

export type Locale_L = Locale;

export const ritualCopy = {
  title: {
    en: 'Mariyas Ritual Finder',
    ml: 'മരിയാസ് റിച്വൽ ഫൈൻഡർ',
    hi: 'मरियास रिचुअल फाइंडर',
    ta: 'மரியாஸ் ரிட்டுவல் ஃபைண்டர்',
    kn: 'ಮರಿಯಾಸ್ ರಿಚುಯಲ್ ಫೈಂಡರ್',
  } as Localized,
  kicker: {
    en: 'YOUR NATURE. YOUR RITUAL.',
    ml: 'നിങ്ങളുടെ സ്വഭാവം. നിങ്ങളുടെ പരിചരണം.',
    hi: 'आपकी प्रकृति। आपका रिचुअल।',
    ta: 'உங்கள் இயல்பு. உங்கள் ரிட்டுவல்.',
    kn: 'ನಿಮ್ಮ ಸ್ವಭಾವ. ನಿಮ್ಮ ರಿಚುಯಲ್.',
  } as Localized,
  lede: {
    en: 'A few short questions about your routine. We suggest one to three products from the current catalogue and explain each choice. No account, no email, no phone number.',
    ml: 'നിങ്ങളുടെ പരിചരണത്തെക്കുറിച്ച് കുറച്ച് ചോദ്യങ്ങൾ. കാറ്റലോഗിൽ നിന്ന് ഒന്ന് മുതൽ മൂന്ന് വരെ ഉൽപ്പന്നങ്ങൾ നിർദ്ദേശിക്കും, കാരണത്തോടെ. അക്കൗണ്ടോ ഇമെയിലോ ഫോണോ വേണ്ട.',
    hi: 'आपकी दिनचर्या के बारे में कुछ छोटे प्रश्न। हम मौजूदा कैटलॉग से एक से तीन उत्पाद सुझाते हैं और हर कारण बताते हैं। कोई खाता, ईमेल या फ़ोन नंबर नहीं।',
    ta: 'உங்கள் பராமரிப்புப் பழக்கம் குறித்து சில கேள்விகள். பட்டியலிலிருந்து ஒன்று முதல் மூன்று வரை பரிந்துரைத்து காரணம் தருகிறோம். கணக்கு, மின்னஞ்சல், எண் தேவையில்லை.',
    kn: 'ನಿಮ್ಮ ದಿನಚರ್ಯೆ ಬಗ್ಗೆ ಕೆಲವು ಸಣ್ಣ ಪ್ರಶ್ನೆಗಳು. ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಿಂದ ಒಂದರಿಂದ ಮೂರರವರೆಗೆ ಸೂಚಿಸಿ ಪ್ರತಿಯೊಂದಕ್ಕೂ ಕಾರಣ ಹೇಳುತ್ತೇವೆ. ಖಾತೆ, ಇಮೇಲ್ ಅಥವಾ ದೂರವಾಣಿ ಸಂಖ್ಯೆ ಬೇಡ.',
  } as Localized,
  start: {
    en: 'Begin',
    ml: 'ആരംഭിക്കൂ',
    hi: 'शुरू करें',
    ta: 'தொடங்கு',
    kn: 'ಪ್ರಾರಂಭಿಸಿ',
  } as Localized,
  back: {
    en: 'Back',
    ml: 'പിന്നോട്ട്',
    hi: 'पीछे',
    ta: 'பின்',
    kn: 'ಹಿಂದೆ',
  } as Localized,
  next: {
    en: 'Continue',
    ml: 'തുടരൂ',
    hi: 'आगे',
    ta: 'தொடர்',
    kn: 'ಮುಂದುವರಿಸಿ',
  } as Localized,
  seeResults: {
    en: 'See my ritual',
    ml: 'എന്റെ പരിചരണം കാണൂ',
    hi: 'मेरा रिचुअल देखें',
    ta: 'என் ரிட்டுவலைப் பார்',
    kn: 'ನನ್ನ ರಿಚುಯಲ್ ನೋಡಿ',
  } as Localized,
  step: {
    en: 'Step {current} of {total}',
    ml: 'ഘട്ടം {current} / {total}',
    hi: 'चरण {current} / {total}',
    ta: 'படி {current} / {total}',
    kn: 'ಹಂತ {current} / {total}',
  } as Localized,
  chooseLanguageNote: {
    en: 'You can change the language at any time; your answers stay.',
    ml: 'എപ്പോൾ വേണമെങ്കിലും ഭാഷ മാറ്റാം; ഉത്തരങ്ങൾ നിലനിൽക്കും.',
    hi: 'भाषा कभी भी बदल सकते हैं; आपके उत्तर बने रहेंगे।',
    ta: 'எப்போது வேண்டுமானாலும் மொழியை மாற்றலாம்; பதில்கள் அப்படியே இருக்கும்.',
    kn: 'ಬೇಕಾದಾಗ ಭಾಷೆ ಬದಲಿಸಬಹುದು; ಉತ್ತರಗಳು ಹಾಗೆಯೇ ಇರುತ್ತವೆ.',
  } as Localized,
  multiHint: {
    en: 'Choose as many as apply.',
    ml: 'ബാധകമായവയെല്ലാം തിരഞ്ഞെടുക്കൂ.',
    hi: 'जो लागू हों, सभी चुनें।',
    ta: 'பொருந்துவன அனைத்தையும் தேர்ந்தெடுங்கள்.',
    kn: 'ಅನ್ವಯಿಸುವ ಎಲ್ಲವನ್ನೂ ಆರಿಸಿ.',
  } as Localized,
  singleHint: {
    en: 'Choose one.',
    ml: 'ഒന്ന് തിരഞ്ഞെടുക്കൂ.',
    hi: 'एक चुनें।',
    ta: 'ஒன்றைத் தேர்ந்தெடுங்கள்.',
    kn: 'ಒಂದನ್ನು ಆರಿಸಿ.',
  } as Localized,
  optional: {
    en: 'Optional',
    ml: 'നിർബന്ധമില്ല',
    hi: 'वैकल्पिक',
    ta: 'விருப்பம்',
    kn: 'ಐಚ್ಛಿಕ',
  } as Localized,
  skip: {
    en: 'Skip this question',
    ml: 'ഈ ചോദ്യം ഒഴിവാക്കൂ',
    hi: 'यह प्रश्न छोड़ें',
    ta: 'இந்தக் கேள்வியைத் தவிர்',
    kn: 'ಈ ಪ್ರಶ್ನೆ ಬಿಡಿ',
  } as Localized,
  resultsTitle: {
    en: 'Your Mariyas ritual',
    ml: 'നിങ്ങളുടെ മരിയാസ് പരിചരണം',
    hi: 'आपका मरियास रिचुअल',
    ta: 'உங்கள் மரியாஸ் ரிட்டுவல்',
    kn: 'ನಿಮ್ಮ ಮರಿಯಾಸ್ ರಿಚುಯಲ್',
  } as Localized,
  resultsLede: {
    en: 'Based only on the answers below. Every product links to its own page on the official store.',
    ml: 'താഴെ നൽകിയ ഉത്തരങ്ങളുടെ അടിസ്ഥാനത്തിൽ മാത്രം. ഓരോ ഉൽപ്പന്നവും ഔദ്യോഗിക സ്റ്റോറിലെ സ്വന്തം പേജിലേക്ക് ലിങ്ക് ചെയ്യുന്നു.',
    hi: 'केवल नीचे दिए गए उत्तरों के आधार पर। हर उत्पाद आधिकारिक स्टोर के अपने पेज से जुड़ा है।',
    ta: 'கீழே தந்த பதில்களின் அடிப்படையில் மட்டும். ஒவ்வொரு தயாரிப்பும் அதிகாரப்பூர்வ கடையின் சொந்தப் பக்கத்திற்கு இணைக்கப்பட்டுள்ளது.',
    kn: 'ಕೆಳಗೆ ನೀಡಿದ ಉತ್ತರಗಳ ಆಧಾರದಲ್ಲಿ ಮಾತ್ರ. ಪ್ರತಿ ಉತ್ಪನ್ನವೂ ಅಧಿಕೃತ ಅಂಗಡಿಯ ತನ್ನದೇ ಪುಟಕ್ಕೆ ಜೋಡಿಸಲಾಗಿದೆ.',
  } as Localized,
  why: {
    en: 'Why this one',
    ml: 'എന്തുകൊണ്ട് ഇത്',
    hi: 'यह क्यों',
    ta: 'ஏன் இது',
    kn: 'ಏಕೆ ಇದು',
  } as Localized,
  placement: {
    en: 'Where it fits in a routine',
    ml: 'പരിചരണത്തിൽ എവിടെ',
    hi: 'दिनचर्या में कहाँ',
    ta: 'பராமரிப்பில் எங்கே',
    kn: 'ದಿನಚರ್ಯೆಯಲ್ಲಿ ಎಲ್ಲಿ',
  } as Localized,
  viewProduct: {
    en: 'View on the official store',
    ml: 'ഔദ്യോഗിക സ്റ്റോറിൽ കാണുക',
    hi: 'आधिकारिक स्टोर पर देखें',
    ta: 'அதிகாரப்பூர்வ கடையில் பார்க்க',
    kn: 'ಅಧಿಕೃತ ಅಂಗಡಿಯಲ್ಲಿ ನೋಡಿ',
  } as Localized,
  review: {
    en: 'Review my answers',
    ml: 'ഉത്തരങ്ങൾ പരിശോധിക്കൂ',
    hi: 'मेरे उत्तर देखें',
    ta: 'என் பதில்களைப் பார்',
    kn: 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ನೋಡಿ',
  } as Localized,
  restart: {
    en: 'Start again',
    ml: 'വീണ്ടും തുടങ്ങൂ',
    hi: 'फिर से शुरू करें',
    ta: 'மீண்டும் தொடங்கு',
    kn: 'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ',
  } as Localized,
  changeAnswer: {
    en: 'Change',
    ml: 'മാറ്റൂ',
    hi: 'बदलें',
    ta: 'மாற்று',
    kn: 'ಬದಲಿಸಿ',
  } as Localized,
  browseAll: {
    en: 'Browse the full catalogue',
    ml: 'പൂർണ്ണ കാറ്റലോഗ് കാണുക',
    hi: 'पूरा कैटलॉग देखें',
    ta: 'முழு பட்டியலைப் பார்க்க',
    kn: 'ಪೂರ್ಣ ಪಟ್ಟಿ ನೋಡಿ',
  } as Localized,
  answersTitle: {
    en: 'Your answers',
    ml: 'നിങ്ങളുടെ ഉത്തരങ്ങൾ',
    hi: 'आपके उत्तर',
    ta: 'உங்கள் பதில்கள்',
    kn: 'ನಿಮ್ಮ ಉತ್ತರಗಳು',
  } as Localized,
  fallbackTitle: {
    en: 'A cautious starting point',
    ml: 'സൂക്ഷ്മമായ ഒരു തുടക്കം',
    hi: 'सतर्क शुरुआत',
    ta: 'கவனமான தொடக்கம்',
    kn: 'ಎಚ್ಚರಿಕೆಯ ಆರಂಭ',
  } as Localized,
  fallbackBody: {
    en: 'Your answers did not point clearly at one product, so rather than invent a match we are showing the most versatile basics in the catalogue. Adjust an answer to narrow it down, or browse everything.',
    ml: 'നിങ്ങളുടെ ഉത്തരങ്ങൾ ഒരു ഉൽപ്പന്നത്തിലേക്ക് വ്യക്തമായി ചൂണ്ടിയില്ല. ഒരു പൊരുത്തം കെട്ടിച്ചമയ്ക്കുന്നതിന് പകരം കാറ്റലോഗിലെ ഏറ്റവും വൈവിധ്യമാർന്ന അടിസ്ഥാന ഉൽപ്പന്നങ്ങൾ കാണിക്കുന്നു.',
    hi: 'आपके उत्तर किसी एक उत्पाद की ओर स्पष्ट संकेत नहीं करते, इसलिए मेल गढ़ने के बजाय हम कैटलॉग के सबसे उपयुक्त बुनियादी उत्पाद दिखा रहे हैं।',
    ta: 'உங்கள் பதில்கள் ஒரு தயாரிப்பை தெளிவாகச் சுட்டவில்லை; எனவே பொருத்தத்தைக் கற்பனை செய்யாமல் பட்டியலின் மிகவும் பொதுவான அடிப்படைத் தயாரிப்புகளைக் காட்டுகிறோம்.',
    kn: 'ನಿಮ್ಮ ಉತ್ತರಗಳು ಒಂದು ಉತ್ಪನ್ನವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಸೂಚಿಸಲಿಲ್ಲ; ಹೊಂದಿಕೆಯನ್ನು ಕಲ್ಪಿಸುವ ಬದಲು ಪಟ್ಟಿಯ ಅತ್ಯಂತ ಸೂಕ್ತ ಮೂಲ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.',
  } as Localized,
  disclaimer: {
    en: 'This tool offers cosmetic product guidance only, based on what you select. Mariyas products are herbal cosmetics, not medicines. They are not intended to diagnose, treat, cure or prevent any condition. If you have a scalp or skin concern that is painful, spreading, sudden or long-lasting, or if you are pregnant, nursing or on medication, please speak to a qualified doctor or Ayurvedic practitioner first. Patch-test before first use.',
    ml: 'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്നതിന്റെ അടിസ്ഥാനത്തിൽ കോസ്മെറ്റിക് ഉൽപ്പന്ന നിർദ്ദേശം മാത്രം. മരിയാസ് ഉൽപ്പന്നങ്ങൾ ഹെർബൽ കോസ്മെറ്റിക്സ് ആണ്, മരുന്നുകളല്ല. രോഗനിർണയത്തിനോ ചികിത്സയ്ക്കോ അല്ല. വേദനയോ വ്യാപനമോ പെട്ടെന്നുള്ളതോ ദീർഘകാലമുള്ളതോ ആയ തലയോട്ടി/ചർമ്മ പ്രശ്നങ്ങൾ ഉണ്ടെങ്കിൽ, ഗർഭിണിയോ മുലയൂട്ടുന്നവരോ മരുന്ന് കഴിക്കുന്നവരോ ആണെങ്കിൽ ആദ്യം യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കൂ. ആദ്യ ഉപയോഗത്തിന് മുൻപ് പാച്ച് ടെസ്റ്റ് ചെയ്യൂ.',
    hi: 'यह टूल केवल आपके चयन के आधार पर कॉस्मेटिक उत्पाद मार्गदर्शन देता है। मरियास उत्पाद हर्बल कॉस्मेटिक्स हैं, दवाइयाँ नहीं। ये किसी स्थिति के निदान, उपचार या रोकथाम के लिए नहीं हैं। यदि खोपड़ी या त्वचा की कोई समस्या दर्दभरी, फैलती हुई, अचानक या लंबे समय तक रहने वाली है, या आप गर्भवती, स्तनपान कराने वाली या दवा पर हैं, तो पहले योग्य चिकित्सक या आयुर्वेदाचार्य से मिलें। पहले उपयोग से पहले पैच टेस्ट करें।',
    ta: 'இந்தக் கருவி நீங்கள் தேர்ந்தெடுப்பதன் அடிப்படையில் அழகுசாதனப் பொருள் வழிகாட்டுதல் மட்டுமே தருகிறது. மரியாஸ் தயாரிப்புகள் ஹெர்பல் அழகுசாதனப் பொருட்கள், மருந்துகள் அல்ல. நோய் கண்டறிதல், சிகிச்சை அல்லது தடுப்புக்கானவை அல்ல. வலியுடனோ, பரவக்கூடியதாகவோ, திடீரெனவோ அல்லது நீண்டகாலமாகவோ தலைக்கவசம்/சருமப் பிரச்சினை இருந்தால், அல்லது கர்ப்பமாக இருந்தால், தாய்ப்பால் ஊட்டினால் அல்லது மருந்து எடுத்தால், முதலில் தகுதியான மருத்துவரை அணுகுங்கள். முதல் பயன்பாட்டுக்கு முன் பேட்ச் டெஸ்ட் செய்யுங்கள்.',
    kn: 'ಈ ಸಾಧನ ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ ಆಧಾರದಲ್ಲಿ ಸೌಂದರ್ಯವರ್ಧಕ ಉತ್ಪನ್ನ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ ನೀಡುತ್ತದೆ. ಮರಿಯಾಸ್ ಉತ್ಪನ್ನಗಳು ಹೆರ್ಬಲ್ ಸೌಂದರ್ಯವರ್ಧಕಗಳು, ಔಷಧಿಗಳಲ್ಲ. ರೋಗನಿರ್ಣಯ, ಚಿಕಿತ್ಸೆ ಅಥವಾ ತಡೆಗಟ್ಟುವಿಕೆಗೆ ಅಲ್ಲ. ನೋವಿನೊಂದಿಗೆ, ಹರಡುವ, ಇದ್ದಕ್ಕಿದ್ದಂತೆ ಅಥವಾ ದೀರ್ಘಕಾಲದ ತಲೆಬುರುಡೆ/ಚರ್ಮದ ಸಮಸ್ಯೆ ಇದ್ದರೆ, ಅಥವಾ ಗರ್ಭಿಣಿ, ಹಾಲುಣಿಸುವ ಅಥವಾ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದರೆ, ಮೊದಲು ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ಮೊದಲ ಬಳಕೆಗೆ ಮೊದಲು ಪ್ಯಾಚ್ ಟೆಸ್ಟ್ ಮಾಡಿ.',
  } as Localized,
  privacy: {
    en: 'Nothing you choose is sent anywhere or stored on a server. Answers live in this browser tab only.',
    ml: 'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്നത് എവിടെയും അയക്കുന്നില്ല, സെർവറിൽ സൂക്ഷിക്കുന്നുമില്ല. ഈ ബ്രൗസർ ടാബിൽ മാത്രം.',
    hi: 'आपकी पसंद कहीं नहीं भेजी जाती और सर्वर पर संग्रहीत नहीं होती। उत्तर केवल इस ब्राउज़र टैब में रहते हैं।',
    ta: 'நீங்கள் தேர்ந்தெடுப்பது எங்கும் அனுப்பப்படவில்லை, சேவையகத்தில் சேமிக்கப்படவில்லை. இந்த உலாவி தாவலில் மட்டும்.',
    kn: 'ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ್ದು ಎಲ್ಲಿಗೂ ಕಳುಹಿಸುವುದಿಲ್ಲ, ಸರ್ವರ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ. ಈ ಬ್ರೌಸರ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಮಾತ್ರ.',
  } as Localized,
  noJs: {
    en: 'The Ritual Finder needs JavaScript to walk through the questions. You can still browse the full catalogue and every product page without it.',
    ml: 'ചോദ്യങ്ങൾക്കായി റിച്വൽ ഫൈൻഡറിന് JavaScript ആവശ്യമാണ്. എന്നിട്ടും പൂർണ്ണ കാറ്റലോഗും ഓരോ ഉൽപ്പന്ന പേജും കാണാം.',
    hi: 'प्रश्नों के लिए रिचुअल फाइंडर को JavaScript चाहिए। फिर भी पूरा कैटलॉग और हर उत्पाद पेज देखा जा सकता है।',
    ta: 'கேள்விகளுக்கு ரிட்டுவல் ஃபைண்டருக்கு JavaScript தேவை. இருந்தாலும் முழு பட்டியலையும் ஒவ்வொரு தயாரிப்புப் பக்கத்தையும் பார்க்கலாம்.',
    kn: 'ಪ್ರಶ್ನೆಗಳಿಗೆ ರಿಚುಯಲ್ ಫೈಂಡರ್‌ಗೆ JavaScript ಬೇಕು. ಆದರೂ ಪೂರ್ಣ ಪಟ್ಟಿ ಮತ್ತು ಪ್ರತಿ ಉತ್ಪನ್ನ ಪುಟವನ್ನು ನೋಡಬಹುದು.',
  } as Localized,
  categoryLabel: {
    en: 'What would you like to care for?',
    ml: 'എന്തിനെ പരിപാലിക്കണം?',
    hi: 'आप किसकी देखभाल करना चाहते हैं?',
    ta: 'எதற்குப் பராமரிப்பு?',
    kn: 'ಏನನ್ನು ನೋಡಿಕೊಳ್ಳಬೇಕು?',
  } as Localized,
};

/* ------------------------------------------------------------------ answers -- */

export type HairScalp = 'dry' | 'oily' | 'flaky' | 'sensitive' | 'unsure';
export type HairType = 'fine' | 'wavy' | 'curly' | 'straight' | 'unsure';
export type HairConcern =
  'fall' | 'thinning' | 'dryness' | 'frizz' | 'greying' | 'dandruff' | 'shine';
export type Routine = 'weekly' | 'twice' | 'daily' | 'rare';
export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'unsure';
export type SkinFocus =
  'hydration' | 'glow' | 'texture' | 'soothing' | 'hair-adjacent';
export type AgeBand = '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'skip';

export interface AnswerSet {
  category?: 'hair' | 'skin' | 'both';
  hairScalp?: HairScalp;
  hairType?: HairType;
  hairConcerns?: HairConcern[];
  routine?: Routine;
  skinType?: SkinType;
  skinFocus?: SkinFocus[];
  age?: AgeBand;
}

export interface RitualOption<T extends string = string> {
  value: T;
  label: Localized;
  /** Short helper line under the label; omit for a plain row. */
  hint?: Localized;
  /** Simple line-art glyph, 24×24 viewBox. */
  icon?: string;
}

/**
 * One question row. Generic in the answer key so each option list keeps its own
 * union type: `row('dry', …)` in a `RitualOption<HairScalp>[]` stays narrow
 * instead of widening to `string`.
 */
const row = <T extends string>(
  value: T,
  en: string,
  ml: string,
  hi: string,
  ta: string,
  kn: string,
  icon?: string,
): RitualOption<T> => ({
  value,
  label: { en, ml, hi, ta, kn },
  icon,
});

/** Line-art glyphs, drawn for this interface. */
const ICON = {
  drop: 'M12 3c3.2 3 5.5 5.9 5.5 9a5.5 5.5 0 0 1-11 0C6.5 8.9 8.8 6 12 3Z',
  leaf: 'M20 4c-8 0-13 4-13 9.5A6.5 6.5 0 0 0 13.5 20C19 20 20 13 20 4Zm0 0C13 11 10 14 7 17',
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0-4v2m0 13v2M3.5 12h2m13 0h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18',
  wave: 'M3 9c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0S20.6 7 22 8M3 15c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0S20.6 13 22 14',
  comb: 'M5 20V7a2 2 0 0 1 4 0v13M9 12h10M19 20V8a2 2 0 0 0-2-2',
  bottle: 'M10 3h4v3l2 2v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-2V3Zm-2 8h8',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 4V12l3 2',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  person:
    'M12 4.5a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4ZM5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6',
  layers: 'M12 3 3 7.5 12 12l9-4.5L12 3Zm-9 9 9 4.5 9-4.5M3 16.5 12 21l9-4.5',
};

export const optionsCategory: RitualOption<'hair' | 'skin' | 'both'>[] = [
  {
    value: 'hair',
    label: {
      en: 'Hair & scalp',
      ml: 'മുടിയും തലയോട്ടിയും',
      hi: 'बाल और खोपड़ी',
      ta: 'முடி மற்றும் தலைக்கவசம்',
      kn: 'ಕೂದಲು ಮತ್ತು ನೆತ್ತಿ',
    },
    icon: ICON.bottle,
  },
  {
    value: 'skin',
    label: {
      en: 'Skin',
      ml: 'ചർമ്മം',
      hi: 'त्वचा',
      ta: 'சருமம்',
      kn: 'ಚರ್ಮ',
    },
    icon: ICON.leaf,
  },
  {
    value: 'both',
    label: {
      en: 'Both',
      ml: 'രണ്ടും',
      hi: 'दोनों',
      ta: 'இரண்டும்',
      kn: 'ಎರಡೂ',
    },
    icon: ICON.layers,
  },
];

export const optionsHairScalp: RitualOption<HairScalp>[] = [
  row('dry', 'Dry', 'വരണ്ടത്', 'रूखी', 'வறண்ட', 'ಒಣ', ICON.sun),
  row(
    'oily',
    'Oily',
    'എണ്ണമയമുള്ളത്',
    'तैलीय',
    'எண்ணெய்ப் பசை',
    'ಎಣ್ಣೆಯುಕ್ತ',
    ICON.drop,
  ),
  row(
    'flaky',
    'Flaky',
    'പൊടിയുള്ളത്',
    'रूसी वाली',
    'பொடி',
    'ಹೊಟ್ಟು',
    ICON.wave,
  ),
  row(
    'sensitive',
    'Sensitive',
    'സെൻസിറ്റീവ്',
    'संवेदनशील',
    'உணர்திறன்',
    'ಸೂಕ್ಷ್ಮ',
    ICON.spark,
  ),
  row(
    'unsure',
    'Not sure',
    'ഉറപ്പില്ല',
    'पता नहीं',
    'தெரியவில்லை',
    'ಖಚಿತವಿಲ್ಲ',
    ICON.person,
  ),
];

export const optionsHairType: RitualOption<HairType>[] = [
  row('straight', 'Straight', 'നേരെയുള്ളത്', 'सीधे', 'நேராக', 'ನೇರ', ICON.comb),
  row('wavy', 'Wavy', 'അലകളുള്ളത്', 'लहरदार', 'அலை', 'ಅಲೆ', ICON.comb),
  row(
    'curly',
    'Curly or coily',
    'ചുരുണ്ടത്',
    'घुंघराले',
    'சுருள்',
    'ಸುರುಳಿ',
    ICON.comb,
  ),
  row(
    'fine',
    'Fine and thin',
    'നേർത്തത്',
    'पतले और बारीक',
    'மெல்லிய',
    'ತೆಳು',
    ICON.comb,
  ),
  row(
    'unsure',
    'Not sure',
    'ഉറപ്പില്ല',
    'पता नहीं',
    'தெரியவில்லை',
    'ಖಚಿತವಿಲ್ಲ',
    ICON.person,
  ),
];

export const optionsHairConcern: RitualOption<HairConcern>[] = [
  row(
    'fall',
    'Hair fall',
    'മുടി കൊഴിച്ചിൽ',
    'बाल झड़ना',
    'முடி உதிர்வு',
    'ಕೂದಲು ಉದುರುವಿಕೆ',
    ICON.drop,
  ),
  row(
    'thinning',
    'Thinning',
    'മുടി കനം കുറയുന്നു',
    'बाल पतले होना',
    'முடி மெலிதல்',
    'ಕೂದಲು ತೆಳುವಾಗುವುದು',
    ICON.leaf,
  ),
  row('dryness', 'Dryness', 'വരൾച്ച', 'रूखापन', 'வறட்சி', 'ಒಣಗುವಿಕೆ', ICON.sun),
  row(
    'frizz',
    'Frizz',
    'ചുരുളഴിയാത്തത്',
    'फ्रिज़',
    'சுருள் கலக்கம்',
    'ಫ್ರಿಜ್',
    ICON.wave,
  ),
  row(
    'greying',
    'Early greying',
    'നേരത്തെ നര',
    'जल्दी सफ़ेद',
    'முன்கூட்டிய நரை',
    'ಬೇಗ ನರೆ',
    ICON.spark,
  ),
  row(
    'dandruff',
    'Flakes',
    'തലയോട്ടിയിലെ പൊടി',
    'रूसी',
    'பொடுகு',
    'ಹೊಟ್ಟು',
    ICON.wave,
  ),
  row(
    'shine',
    'Dullness',
    'തിളക്കമില്ലായ്മ',
    'बेजान',
    'மங்கல்',
    'ಮಂಕು',
    ICON.sun,
  ),
];

export const optionsRoutine: RitualOption<Routine>[] = [
  row(
    'weekly',
    'Once a week',
    'ആഴ്ചയിൽ ഒരിക്കൽ',
    'सप्ताह में एक बार',
    'வாரம் ஒருமுறை',
    'ವಾರಕ್ಕೆ ಒಮ್ಮೆ',
    ICON.clock,
  ),
  row(
    'twice',
    'Twice a week',
    'ആഴ്ചയിൽ രണ്ട് തവണ',
    'सप्ताह में दो बार',
    'வாரம் இருமுறை',
    'ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ',
    ICON.clock,
  ),
  row(
    'daily',
    'Every day or almost',
    'ഏതാണ്ട് ദിവസവും',
    'लगभग रोज़',
    'கிட்டத்தட்ட தினமும்',
    'ಬಹುತೇಕ ಪ್ರತಿದಿನ',
    ICON.clock,
  ),
  row(
    'rare',
    'Now and then',
    'ഇടയ്ക്കിടെ',
    'कभी-कभी',
    'அப்போதைக்கப்போது',
    'ಈಗಾಗ',
    ICON.clock,
  ),
];

export const optionsSkinType: RitualOption<SkinType>[] = [
  row(
    'oily',
    'Oily',
    'എണ്ണമയമുള്ളത്',
    'तैलीय',
    'எண்ணெய்ப் பசை',
    'ಎಣ್ಣೆಯುಕ್ತ',
    ICON.drop,
  ),
  row('dry', 'Dry', 'വരണ്ടത്', 'रूखी', 'வறண்ட', 'ಒಣ', ICON.sun),
  row(
    'combination',
    'Combination',
    'മിശ്രിതം',
    'मिश्रित',
    'கலவை',
    'ಮಿಶ್ರ',
    ICON.layers,
  ),
  row('normal', 'Normal', 'സാധാരണ', 'सामान्य', 'இயல்பான', 'ಸಾಮಾನ್ಯ', ICON.leaf),
  row(
    'unsure',
    'Not sure',
    'ഉറപ്പില്ല',
    'पता नहीं',
    'தெரியவில்லை',
    'ಖಚಿತವಿಲ್ಲ',
    ICON.person,
  ),
];

export const optionsSkinFocus: RitualOption<SkinFocus>[] = [
  row(
    'hydration',
    'Dryness',
    'വരൾച്ച',
    'रूखापन',
    'வறட்சி',
    'ಒಣಗುವಿಕೆ',
    ICON.sun,
  ),
  row(
    'glow',
    'Dullness',
    'തിളക്കമില്ലായ്മ',
    'बेजान',
    'மங்கல்',
    'ಮಂಕು',
    ICON.spark,
  ),
  row(
    'texture',
    'Uneven texture',
    'അസമമായ പ്രതലം',
    'असमान बनावट',
    'சீரற்ற அமைப்பு',
    'ಅಸಮ ರಚನೆ',
    ICON.layers,
  ),
  row(
    'soothing',
    'Easily irritated',
    'എളുപ്പം പ്രകോപിതം',
    'जल्दी चिढ़ने वाली',
    'எளிதில் எரிச்சல்',
    'ಸುಲಭವಾಗಿ ಕೆರಳುವ',
    ICON.leaf,
  ),
];

export const optionsAge: RitualOption<AgeBand>[] = [
  row('18-24', '18–24', '18–24', '18–24', '18–24', '18–24'),
  row('25-34', '25–34', '25–34', '25–34', '25–34', '25–34'),
  row('35-44', '35–44', '35–44', '35–44', '35–44', '35–44'),
  row('45-54', '45–54', '45–54', '45–54', '45–54', '45–54'),
  row('55+', '55+', '55+', '55+', '55+', '55+'),
];

/* ----------------------------------------------------------------- products -- */

export interface RitualProduct {
  /** Catalogue id on this site, for a local product page link. */
  id: string;
  slug: string;
  /** Official store name, verbatim. */
  name: string;
  /** Verified permalink. */
  href: string;
  storeProductId: number;
  /** Which concerns this product is a sensible cosmetic fit for. */
  cares: string[];
  /** Local approved image, when we legitimately hold one. */
  imageId?: string;
  category: 'hair' | 'skin' | 'wellness' | 'baby';
}

/**
 * The candidate products for the Ritual Finder, before the owner's visibility
 * policy is applied. Kept whole so the recommendation model stays verifiable
 * against the full catalogue.
 */
const ritualCandidates: readonly RitualProduct[] = [
  {
    id: 'mn-89552',
    slug: 'mariyas-hair-oil-200-ml',
    name: 'Mariyas Herbal Hair Care Oil – 200 ml',
    href: 'https://www.mariyasnaturals.com/product/mariyas-herbal-hair-care-oil-200-ml/',
    storeProductId: 3008,
    cares: ['fall', 'thinning', 'dryness', 'greying', 'shine', 'frizz'],
    imageId: 'product-media-4294',
    category: 'hair',
  },
  {
    id: 'mn-89553',
    slug: 'mariyas-hair-oil-500-ml',
    name: 'Mariyas Herbal Hair Care – 500 ml',
    href: 'https://www.mariyasnaturals.com/product/mariyas-herbal-hair-care-500-ml/',
    storeProductId: 3009,
    cares: ['fall', 'thinning', 'dryness', 'greying', 'shine', 'frizz'],
    imageId: 'product-media-4290',
    category: 'hair',
  },
  {
    id: 'mn-19191',
    slug: 'coconut-milk-shampoo-200ml-19191',
    name: 'Coconut Milk Shampoo 200 ml',
    href: 'https://www.mariyasnaturals.com/product/coconut-milk-shampoo-200-ml/',
    storeProductId: 2868,
    imageId: 'product-media-4316',
    cares: ['dryness', 'frizz', 'shine', 'dandruff'],
    category: 'hair',
  },
  {
    id: 'mn-19193',
    slug: 'amla-shikkakai-shampoo-200ml-19193',
    name: 'Amla Shikkakai Shampoo 200 ml',
    href: 'https://www.mariyasnaturals.com/product/amla-shikkakai-shampoo-200-ml/',
    storeProductId: 2869,
    imageId: 'product-media-4321',
    cares: ['dandruff', 'fall', 'thinning'],
    category: 'hair',
  },
  {
    id: 'mn-19197',
    slug: 'tulsi-shampoo-200ml-19197',
    name: 'Tulsi Shampoo 200 ml',
    href: 'https://www.mariyasnaturals.com/product/tulsi-shampoo-200-ml/',
    storeProductId: 2871,
    imageId: 'product-media-4330',
    cares: ['dandruff', 'oily'],
    category: 'hair',
  },
  {
    id: 'mn-19195',
    slug: 'honey-aloevera-shampoo-200ml-19195',
    name: 'Honey Aloevera Shampoo 200 ml',
    href: 'https://www.mariyasnaturals.com/product/honey-aloevera-shampoo-200-ml/',
    storeProductId: 2870,
    imageId: 'product-media-4325',
    cares: ['dryness', 'frizz', 'shine'],
    category: 'hair',
  },
  {
    id: 'mn-76995',
    slug: 'rosemary-water-200ml-76995',
    name: 'Rosemary Water 200 ml',
    href: 'https://www.mariyasnaturals.com/product/rosemary-water-200-ml/',
    storeProductId: 2942,
    imageId: 'product-media-4709',
    cares: ['fall', 'thinning'],
    category: 'hair',
  },
  {
    id: 'mn-19224',
    slug: 'rose-water-200ml-19224',
    name: 'Rose Water 200 ml',
    href: 'https://www.mariyasnaturals.com/product/rose-water-200-ml/',
    storeProductId: 2883,
    imageId: 'product-media-4724',
    cares: ['hydration', 'glow', 'soothing'],
    category: 'skin',
  },
  {
    id: 'mn-19226',
    slug: 'beard-oil-50ml-19226',
    name: 'Beard Oil 50 ml',
    href: 'https://www.mariyasnaturals.com/product/beard-oil-50-ml/',
    storeProductId: 2884,
    imageId: 'product-media-4759',
    cares: ['dryness', 'texture'],
    category: 'skin',
  },
  {
    id: 'mn-19517',
    slug: 'saffron-gel-100g-19517',
    name: 'Saffron Gel 100 g',
    href: 'https://www.mariyasnaturals.com/product/saffron-gel-100-g/',
    storeProductId: 2889,
    imageId: 'product-media-4694',
    cares: ['glow', 'hydration'],
    category: 'skin',
  },
  {
    id: 'mn-19526',
    slug: 'alovera-gel-100gm-19526',
    name: 'Alovera Gel 100 g',
    href: 'https://www.mariyasnaturals.com/product/alovera-gel-100-g/',
    storeProductId: 2891,
    imageId: 'product-media-4776',
    cares: ['hydration', 'soothing', 'texture'],
    category: 'skin',
  },
  {
    id: 'mn-19525',
    slug: 'cucumber-gel-100g-19525',
    name: 'Cucumber Gel 100 g',
    href: 'https://www.mariyasnaturals.com/product/cucumber-gel-100-g/',
    storeProductId: 2890,
    imageId: 'product-media-4781',
    cares: ['soothing', 'hydration'],
    category: 'skin',
  },
  {
    id: 'mn-19528',
    slug: 'heel-crack-cream-25gm-19528',
    name: 'Heal Crack Cream 25 g',
    href: 'https://www.mariyasnaturals.com/product/heal-crack-cream-25-g/',
    storeProductId: 2893,
    imageId: 'product-media-4346',
    cares: ['hydration', 'texture'],
    category: 'skin',
  },
  {
    id: 'mn-19187',
    slug: 'baby-massage-oil-200ml-19187',
    name: 'Baby Massage Oil 200 ml',
    href: 'https://www.mariyasnaturals.com/product/baby-massage-oil-200-ml/',
    storeProductId: 2866,
    imageId: 'product-media-4799',
    cares: ['baby'],
    category: 'baby',
  },
  {
    id: 'mn-19189',
    slug: 'baby-hair-oil-200ml-19189',
    name: 'Baby Hair Oil 200 ml',
    href: 'https://www.mariyasnaturals.com/product/baby-hair-oil-200-ml/',
    storeProductId: 2867,
    imageId: 'product-media-4796',
    cares: ['baby'],
    category: 'baby',
  },
  {
    id: 'mn-90605',
    slug: 'chyavanaprash-90605',
    name: 'Chyavanaprash',
    href: 'https://www.mariyasnaturals.com/product/chyavanaprash/',
    storeProductId: 3011,
    imageId: 'product-media-4742',
    cares: ['wellness'],
    category: 'wellness',
  },
];

/**
 * What the Ritual Finder may actually suggest: only listings that are publicly
 * visible. A hidden-pending-photo product is never recommended, linked or
 * counted.
 */
export const ritualProducts: readonly RitualProduct[] = ritualCandidates.filter(
  (product) => isPubliclyVisible(product.storeProductId),
);

/** Shown when the answers cannot support a real match. Never fabricated. */
export const fallbackProductIds = ['mn-89552', 'mn-19187'] as const;

/**
 * Routine placement, in plain words. Purely how-to-use guidance paraphrased from
 * each product's own directions; no efficacy claim is made here.
 */
export const placementCopy: Record<string, Localized> = {
  'mn-89552': {
    en: 'Warm a little and massage into the scalp, leave for an hour or overnight, then wash out.',
    ml: 'അൽപം ചൂടാക്കി തലയോട്ടിയിൽ തിരുമ്മൂ, ഒരു മണിക്കൂർ അല്ലെങ്കിൽ രാത്രി മുഴുവൻ വെച്ചതിന് ശേഷം കഴുകൂ.',
    hi: 'थोड़ा गर्म करके खोपड़ी में मालिश करें, एक घंटा या रात भर रखें, फिर धो लें।',
    ta: 'சற்று சூடாக்கி தலைக்கவசத்தில் தடவி, ஒரு மணி நேரம் அல்லது இரவு முழுவதும் வைத்த பின் கழுவுங்கள்.',
    kn: 'ಸ್ವಲ್ಪ ಬಿಸಿ ಮಾಡಿ ನೆತ್ತಿಗೆ ಮಸಾಜ್ ಮಾಡಿ, ಒಂದು ಗಂಟೆ ಅಥವಾ ರಾತ್ರಿಯಿಡೀ ಇಟ್ಟು ತೊಳೆಯಿರಿ.',
  },
  'mn-89553': {
    en: 'Same ritual as the 200 ml, in the larger pack for regular use.',
    ml: '200 ml പോലെ തന്നെ, സ്ഥിരമായ ഉപയോഗത്തിന് വലിയ പായ്ക്കിൽ.',
    hi: '200 ml जैसा ही रिचुअल, नियमित उपयोग के लिए बड़े पैक में।',
    ta: '200 ml போலவே, வழக்கமான பயன்பாட்டிற்கு பெரிய பொதியில்.',
    kn: '200 ml ನಂತೆಯೇ, ನಿಯಮಿತ ಬಳಕೆಗೆ ದೊಡ್ಡ ಪ್ಯಾಕ್‌ನಲ್ಲಿ.',
  },
  'mn-19191': {
    en: 'Wash-day step: massage into wet scalp, rinse, follow with hair oil on a separate day.',
    ml: 'കഴുകുന്ന ദിവസം: നനഞ്ഞ തലയോട്ടിയിൽ തിരുമ്മി കഴുകൂ; മറ്റൊരു ദിവസം എണ്ണ ഉപയോഗിക്കൂ.',
    hi: 'धोने वाले दिन: गीली खोपड़ी पर मालिश करें, धो लें; तेल किसी दूसरे दिन लगाएँ।',
    ta: 'கழுவும் நாள்: ஈரமான தலைக்கவசத்தில் தடவி கழுவுங்கள்; எண்ணெயை வேறு நாளில்.',
    kn: 'ತೊಳೆಯುವ ದಿನ: ಒದ್ದೆ ನೆತ್ತಿಗೆ ಮಸಾಜ್ ಮಾಡಿ ತೊಳೆಯಿರಿ; ಎಣ್ಣೆಯನ್ನು ಬೇರೆ ದಿನ.',
  },
  'mn-19193': {
    en: 'Wash-day step: apply to wet hair, work through the scalp, rinse well.',
    ml: 'കഴുകുന്ന ദിവസം: നനഞ്ഞ മുടിയിൽ പുരട്ടി തലയോട്ടിയിൽ പരത്തി നന്നായി കഴുകൂ.',
    hi: 'धोने वाले दिन: गीले बालों पर लगाएँ, खोपड़ी में फैलाएँ, अच्छी तरह धो लें।',
    ta: 'கழுவும் நாள்: ஈரமான முடியில் தடவி, தலைக்கவசத்தில் பரப்பி நன்கு கழுவுங்கள்.',
    kn: 'ತೊಳೆಯುವ ದಿನ: ಒದ್ದೆ ಕೂದಲಿಗೆ ಹಚ್ಚಿ, ನೆತ್ತಿಗೆ ಹರಡಿ ಚೆನ್ನಾಗಿ ತೊಳೆಯಿರಿ.',
  },
  'mn-19197': {
    en: 'Wash-day step: massage into the scalp, leave a moment, rinse.',
    ml: 'കഴുകുന്ന ദിവസം: തലയോട്ടിയിൽ തിരുമ്മി അൽപം നേരം വെച്ച് കഴുകൂ.',
    hi: 'धोने वाले दिन: खोपड़ी में मालिश करें, थोड़ी देर रखें, धो लें।',
    ta: 'கழுவும் நாள்: தலைக்கவசத்தில் தடவி சிறிது நேரம் வைத்து கழுவுங்கள்.',
    kn: 'ತೊಳೆಯುವ ದಿನ: ನೆತ್ತಿಗೆ ಮಸಾಜ್ ಮಾಡಿ ಸ್ವಲ್ಪ ಹೊತ್ತು ಇಟ್ಟು ತೊಳೆಯಿರಿ.',
  },
  'mn-19195': {
    en: 'Wash-day step: use on wet hair as the first wash, rinse thoroughly.',
    ml: 'കഴുകുന്ന ദിവസം: നനഞ്ഞ മുടിയിൽ ആദ്യ കഴുകലായി ഉപയോഗിച്ച് നന്നായി കഴുകൂ.',
    hi: 'धोने वाले दिन: गीले बालों पर पहले धोने के रूप में लगाएँ, अच्छी तरह धो लें।',
    ta: 'கழுவும் நாள்: ஈரமான முடியில் முதல் கழுவலாகப் பயன்படுத்தி நன்கு கழுவுங்கள்.',
    kn: 'ತೊಳೆಯುವ ದಿನ: ಒದ್ದೆ ಕೂದಲಿಗೆ ಮೊದಲ ತೊಳೆಯುವಿಕೆಯಾಗಿ ಬಳಸಿ ಚೆನ್ನಾಗಿ ತೊಳೆಯಿರಿ.',
  },
  'mn-76995': {
    en: 'Finishing step on non-wash days: mist over the scalp, no rinse.',
    ml: 'കഴുകാത്ത ദിവസങ്ങളിൽ: തലയോട്ടിയിൽ തളിച്ച് കഴുകേണ്ടതില്ല.',
    hi: 'बिना धोए दिनों में: खोपड़ी पर स्प्रे करें, धोने की ज़रूरत नहीं।',
    ta: 'கழுவாத நாட்களில்: தலைக்கவசத்தில் தெளிக்கவும், கழுவ வேண்டாம்.',
    kn: 'ತೊಳೆಯದ ದಿನಗಳಲ್ಲಿ: ನೆತ್ತಿಗೆ ಸಿಂಪಡಿಸಿ, ತೊಳೆಯುವ ಅಗತ್ಯವಿಲ್ಲ.',
  },
  'mn-19224': {
    en: 'Toning step after cleansing, or a midday refresh.',
    ml: 'വൃത്തിയാക്കിയതിന് ശേഷമുള്ള ഘട്ടം, അല്ലെങ്കിൽ പകൽ സമയത്തെ പുതുമ.',
    hi: 'सफ़ाई के बाद का चरण, या दिन में ताज़गी के लिए।',
    ta: 'சுத்தம் செய்த பிறகு, அல்லது பகல் நேரப் புத்துணர்வு.',
    kn: 'ಸ್ವಚ್ಛಗೊಳಿಸಿದ ನಂತರ ಅಥವಾ ಮಧ್ಯಾಹ್ನ ತಾಜಾತನ.',
  },
  'mn-19226': {
    en: 'Evening step: a few drops combed through the beard.',
    ml: 'വൈകുന്നേരം: കുറച്ച് തുള്ളികൾ താടിയിൽ ചീർപ്പ് കൊണ്ട് പരത്തൂ.',
    hi: 'शाम को: कुछ बूँदें दाढ़ी में कंघी से फैलाएँ।',
    ta: 'மாலை: சில துளிகளை தாடியில் சீப்பால் பரப்புங்கள்.',
    kn: 'ಸಂಜೆ: ಕೆಲವು ಹನಿಗಳನ್ನು ಗಡ್ಡಕ್ಕೆ ಬಾಚಣಿಗೆಯಿಂದ ಹರಡಿ.',
  },
  'mn-19517': {
    en: 'A thin layer on clean skin, morning or evening.',
    ml: 'വൃത്തിയുള്ള ചർമ്മത്തിൽ നേർത്ത പാളി, രാവിലെയോ വൈകുന്നേരമോ.',
    hi: 'साफ़ त्वचा पर पतली परत, सुबह या शाम।',
    ta: 'சுத்தமான சருமத்தில் மெல்லிய அடுக்கு, காலை அல்லது மாலை.',
    kn: 'ಸ್ವಚ್ಛ ಚರ್ಮಕ್ಕೆ ತೆಳು ಪದರ, ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ.',
  },
  'mn-19526': {
    en: 'Soothing layer on clean skin; patch-test first.',
    ml: 'വൃത്തിയുള്ള ചർമ്മത്തിൽ ശാന്തത നൽകുന്ന പാളി; ആദ്യം പാച്ച് ടെസ്റ്റ് ചെയ്യൂ.',
    hi: 'साफ़ त्वचा पर सुकून देने वाली परत; पहले पैच टेस्ट करें।',
    ta: 'சுத்தமான சருமத்தில் அமைதி தரும் அடுக்கு; முதலில் பேட்ச் டெஸ்ட்.',
    kn: 'ಸ್ವಚ್ಛ ಚರ್ಮಕ್ಕೆ ಶಾಂತಿ ನೀಡುವ ಪದರ; ಮೊದಲು ಪ್ಯಾಚ್ ಟೆಸ್ಟ್.',
  },
  'mn-19525': {
    en: 'Cooling layer on clean skin, especially after sun.',
    ml: 'വൃത്തിയുള്ള ചർമ്മത്തിൽ തണുപ്പിക്കുന്ന പാളി, വെയിലിന് ശേഷം പ്രത്യേകിച്ചും.',
    hi: 'साफ़ त्वचा पर ठंडक देने वाली परत, धूप के बाद विशेष रूप से।',
    ta: 'சுத்தமான சருமத்தில் குளிர்ச்சி தரும் அடுக்கு, வெயிலுக்குப் பிறகு சிறப்பாக.',
    kn: 'ಸ್ವಚ್ಛ ಚರ್ಮಕ್ಕೆ ತಂಪು ನೀಡುವ ಪದರ, ಬಿಸಿಲಿನ ನಂತರ ವಿಶೇಷವಾಗಿ.',
  },
  'mn-19528': {
    en: 'Evening step on clean, dry feet; massage into the heels.',
    ml: 'വൈകുന്നേരം വൃത്തിയുള്ള, വരണ്ട കാലുകളിൽ; കുതികാൽ തിരുമ്മൂ.',
    hi: 'शाम को साफ़, सूखे पैरों पर; एड़ियों में मालिश करें।',
    ta: 'மாலை சுத்தமான, உலர்ந்த கால்களில்; குதிகால் தடவுங்கள்.',
    kn: 'ಸಂಜೆ ಸ್ವಚ್ಛ, ಒಣ ಕಾಲುಗಳಿಗೆ; ಹಿಮ್ಮಡಿಗೆ ಮಸಾಜ್ ಮಾಡಿ.',
  },
  'mn-19187': {
    en: 'Baby routine: a little warmed between the palms, gentle massage, then bath.',
    ml: 'കുഞ്ഞിന്റെ പരിചരണം: കൈകളിൽ ചൂടാക്കി മൃദുവായി തിരുമ്മി കുളിപ്പിക്കൂ.',
    hi: 'शिशु दिनचर्या: हथेलियों में गर्म करें, धीरे मालिश करें, फिर नहलाएँ।',
    ta: 'குழந்தை பராமரிப்பு: கைகளில் சூடாக்கி மெதுவாக தடவி குளிப்பாட்டுங்கள்.',
    kn: 'ಮಗು ದಿನಚರ್ಯೆ: ಅಂಗೈಯಲ್ಲಿ ಬಿಸಿ ಮಾಡಿ ಮೃದುವಾಗಿ ಮಸಾಜ್ ಮಾಡಿ ಸ್ನಾನ ಮಾಡಿಸಿ.',
  },
  'mn-19189': {
    en: 'Baby routine: a small amount on the scalp before bath, a few times a week.',
    ml: 'കുഞ്ഞിന്റെ പരിചരണം: കുളിക്ക് മുൻപ് അൽപം തലയോട്ടിയിൽ, ആഴ്ചയിൽ കുറച്ച് തവണ.',
    hi: 'शिशु दिनचर्या: नहाने से पहले थोड़ा सा खोपड़ी पर, सप्ताह में कुछ बार।',
    ta: 'குழந்தை பராமரிப்பு: குளிக்கும் முன் சிறிதளவு தலைக்கவசத்தில், வாரம் சில முறை.',
    kn: 'ಮಗು ದಿನಚರ್ಯೆ: ಸ್ನಾನಕ್ಕೆ ಮೊದಲು ಸ್ವಲ್ಪ ನೆತ್ತಿಗೆ, ವಾರಕ್ಕೆ ಕೆಲವು ಬಾರಿ.',
  },
  'mn-90605': {
    en: 'A daily spoonful with warm milk or water, as the label directs.',
    ml: 'ലേബൽ നിർദ്ദേശം പോലെ ചെറുചൂടുള്ള പാലിലോ വെള്ളത്തിലോ ദിവസവും ഒരു സ്പൂൺ.',
    hi: 'लेबल के अनुसार रोज़ एक चम्मच गुनगुने दूध या पानी के साथ।',
    ta: 'லேபிளில் உள்ளபடி தினமும் ஒரு ஸ்பூன் இளஞ்சூடான பால் அல்லது நீரில்.',
    kn: 'ಲೇಬಲ್ ಸೂಚನೆಯಂತೆ ಪ್ರತಿದಿನ ಒಂದು ಚಮಚ ಉಗುರುಬೆಚ್ಚಗಿನ ಹಾಲು ಅಥವಾ ನೀರಿನೊಂದಿಗೆ.',
  },
};

/** Reason sentences keyed by the concern that triggered the match. */
export const reasonCopy: Record<string, Localized> = {
  fall: {
    en: 'Herbal hair oil is the Mariyas routine built around scalp massage, which is what you told us you want to spend time on.',
    ml: 'മരിയാസിന്റെ തലയോട്ടി തിരുമ്മലിനെ ചുറ്റിപ്പറ്റിയുള്ള പരിചരണമാണ് ഹെർബൽ ഹെയർ ഓയിൽ — നിങ്ങൾ സമയം നൽകാൻ ആഗ്രഹിക്കുന്നത് അതാണ്.',
    hi: 'हर्बल हेयर ऑयल मरियास का वह रिचुअल है जो खोपड़ी की मालिश पर बना है — आपने यही समय देना बताया।',
    ta: 'தலைக்கவச மசாஜை மையமாகக் கொண்ட மரியாஸ் பராமரிப்பு ஹெர்பல் ஹேர் ஆயில் — நீங்கள் நேரம் ஒதுக்க விரும்புவது அதுவே.',
    kn: 'ನೆತ್ತಿ ಮಸಾಜ್ ಆಧಾರಿತ ಮರಿಯಾಸ್ ಆರೈಕೆ ಹೆರ್ಬಲ್ ಹೇರ್ ಆಯಿಲ್ — ನೀವು ಸಮಯ ನೀಡಲು ಬಯಸಿದ್ದು ಅದೇ.',
  },
  thinning: {
    en: 'A scalp-first oil routine is the gentlest place to start when hair feels thinner than before.',
    ml: 'മുടി മുൻപത്തേക്കാൾ കനം കുറഞ്ഞതായി തോന്നുമ്പോൾ തലയോട്ടിയിൽ നിന്ന് തുടങ്ങുന്ന എണ്ണ പരിചരണമാണ് ഏറ്റവും സൗമ്യമായ തുടക്കം.',
    hi: 'जब बाल पहले से पतले लगें, तो खोपड़ी से शुरू होने वाला तेल रिचुअल सबसे सौम्य शुरुआत है।',
    ta: 'முடி முன்பை விட மெலிதாகத் தோன்றினால், தலைக்கவசத்தில் தொடங்கும் எண்ணெய் பராமரிப்பே மென்மையான தொடக்கம்.',
    kn: 'ಕೂದಲು ಮೊದಲಿಗಿಂತ ತೆಳುವಾಗಿ ಕಂಡರೆ, ನೆತ್ತಿಯಿಂದ ಆರಂಭವಾಗುವ ಎಣ್ಣೆ ಆರೈಕೆಯೇ ಮೃದು ಆರಂಭ.',
  },
  dryness: {
    en: 'You picked dryness, so this is the conditioning end of the range rather than a deep-cleansing one.',
    ml: 'വരൾച്ച തിരഞ്ഞെടുത്തതിനാൽ, കനത്ത വൃത്തിയാക്കലിന് പകരം കണ്ടീഷനിംഗ് വശം ഇതാണ്.',
    hi: 'आपने रूखापन चुना, इसलिए यह गहरी सफ़ाई की जगह कंडीशनिंग वाला विकल्प है।',
    ta: 'வறட்சியைத் தேர்ந்தெடுத்ததால், ஆழ்ந்த சுத்தத்திற்குப் பதிலாக ஈரப்பதம் தரும் வகை இது.',
    kn: 'ಒಣಗುವಿಕೆ ಆರಿಸಿದ್ದರಿಂದ, ಆಳವಾದ ಸ್ವಚ್ಛತೆಯ ಬದಲು ತೇವಾಂಶ ನೀಡುವ ಮಾದರಿ ಇದು.',
  },
  frizz: {
    en: 'Frizz usually responds to conditioning care, which is why this is the smoother of the options.',
    ml: 'ചുരുളഴിയാത്ത അവസ്ഥയ്ക്ക് കണ്ടീഷനിംഗ് പരിചരണം സഹായിക്കും, അതുകൊണ്ടാണ് ഇത് കൂടുതൽ മൃദുവായത്.',
    hi: 'फ्रिज़ में कंडीशनिंग देखभाल मदद करती है, इसलिए यह विकल्प अधिक मुलायम है।',
    ta: 'சுருள் கலக்கத்திற்கு ஈரப்பதப் பராமரிப்பு உதவும், அதனால் இது மென்மையானது.',
    kn: 'ಫ್ರಿಜ್‌ಗೆ ತೇವಾಂಶಯುಕ್ತ ಆರೈಕೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಇದು ಮೃದುವಾದ ಆಯ್ಕೆ.',
  },
  shine: {
    en: 'For dullness, the routine that adds a conditioning layer is the one we would start with.',
    ml: 'തിളക്കമില്ലായ്മയ്ക്ക് കണ്ടീഷനിംഗ് പാളി ചേർക്കുന്ന പരിചരണമാണ് ആദ്യം നിർദ്ദേശിക്കുന്നത്.',
    hi: 'बेजान बालों के लिए हम कंडीशनिंग परत जोड़ने वाला रिचुअल पहले सुझाएँगे।',
    ta: 'மங்கலுக்கு ஈரப்பத அடுக்கு சேர்க்கும் பராமரிப்பையே முதலில் பரிந்துரைப்போம்.',
    kn: 'ಮಂಕುತನಕ್ಕೆ ತೇವಾಂಶ ಪದರ ಸೇರಿಸುವ ಆರೈಕೆಯನ್ನೇ ಮೊದಲು ಸೂಚಿಸುತ್ತೇವೆ.',
  },
  greying: {
    en: 'Traditional Kerala hair care uses oil on the scalp as the base of the routine; this is that base.',
    ml: 'കേരളത്തിലെ പരമ്പരാഗത മുടി പരിചരണത്തിൽ തലയോട്ടിയിലെ എണ്ണയാണ് അടിസ്ഥാനം; അതാണ് ഇത്.',
    hi: 'पारंपरिक केरल बाल देखभाल में खोपड़ी पर तेल आधार है; यह वही आधार है।',
    ta: 'கேரள பாரம்பரிய முடி பராமரிப்பில் தலைக்கவச எண்ணெயே அடிப்படை; அதுவே இது.',
    kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಕೇರಳ ಕೂದಲ ಆರೈಕೆಯಲ್ಲಿ ನೆತ್ತಿಯ ಎಣ್ಣೆಯೇ ಮೂಲ; ಅದೇ ಇದು.',
  },
  dandruff: {
    en: 'You mentioned flakes, so we chose the wash step that is used on the scalp rather than the ends.',
    ml: 'പൊടി സൂചിപ്പിച്ചതിനാൽ, അറ്റങ്ങളെക്കാൾ തലയോട്ടിയിൽ ഉപയോഗിക്കുന്ന കഴുകൽ ഘട്ടം തിരഞ്ഞെടുത്തു.',
    hi: 'आपने रूसी बताई, इसलिए हमने सिरों की जगह खोपड़ी पर लगने वाला धोने का चरण चुना।',
    ta: 'பொடுகு குறிப்பிட்டதால், நுனிகளை விட தலைக்கவசத்தில் பயன்படும் கழுவல் படியைத் தேர்ந்தெடுத்தோம்.',
    kn: 'ಹೊಟ್ಟು ತಿಳಿಸಿದ್ದರಿಂದ, ತುದಿಗಳಿಗಿಂತ ನೆತ್ತಿಗೆ ಬಳಸುವ ತೊಳೆಯುವ ಹಂತ ಆರಿಸಿದ್ದೇವೆ.',
  },
  oily: {
    en: 'You described an oily scalp, so this is the lighter, wash-focused option.',
    ml: 'എണ്ണമയമുള്ള തലയോട്ടി പറഞ്ഞതിനാൽ, ഇത് കൂടുതൽ ലഘുവും കഴുകലിൽ ശ്രദ്ധിക്കുന്നതുമായ ഓപ്ഷനാണ്.',
    hi: 'आपने तैलीय खोपड़ी बताई, इसलिए यह हल्का और धोने पर केंद्रित विकल्प है।',
    ta: 'எண்ணெய்ப் பசை தலைக்கவசம் என்றதால், இது இலகுவான, கழுவலை மையமாகக் கொண்ட தேர்வு.',
    kn: 'ಎಣ್ಣೆಯುಕ್ತ ನೆತ್ತಿ ಎಂದದ್ದರಿಂದ, ಇದು ಹಗುರವಾದ, ತೊಳೆಯುವಿಕೆ ಕೇಂದ್ರಿತ ಆಯ್ಕೆ.',
  },
  hydration: {
    en: 'You picked dryness, so this is the hydrating end of the skin range.',
    ml: 'വരൾച്ച തിരഞ്ഞെടുത്തതിനാൽ, ചർമ്മ പരിചരണത്തിലെ ഈർപ്പം നൽകുന്ന ഭാഗമാണ് ഇത്.',
    hi: 'आपने रूखापन चुना, इसलिए यह त्वचा श्रेणी का नमी देने वाला विकल्प है।',
    ta: 'வறட்சியைத் தேர்ந்தெடுத்ததால், சருமப் பராமரிப்பின் ஈரப்பதம் தரும் பகுதி இது.',
    kn: 'ಒಣಗುವಿಕೆ ಆರಿಸಿದ್ದರಿಂದ, ಚರ್ಮ ಆರೈಕೆಯ ತೇವಾಂಶ ನೀಡುವ ಭಾಗ ಇದು.',
  },
  glow: {
    en: 'For dullness you mentioned, this is the brightening-leaning cosmetic in the range.',
    ml: 'നിങ്ങൾ പറഞ്ഞ തിളക്കമില്ലായ്മയ്ക്ക്, ശേഖരത്തിലെ തിളക്കം ലക്ഷ്യമിടുന്ന കോസ്മെറ്റിക് ഇതാണ്.',
    hi: 'बताई गई बेजानी के लिए, यह संग्रह का चमक की ओर झुका कॉस्मेटिक है।',
    ta: 'நீங்கள் குறிப்பிட்ட மங்கலுக்கு, தொகுப்பின் பிரகாசத்தை நோக்கிய அழகுசாதனப் பொருள் இது.',
    kn: 'ನೀವು ತಿಳಿಸಿದ ಮಂಕುತನಕ್ಕೆ, ಸಂಗ್ರಹದ ಹೊಳಪು ಕಡೆಗಿನ ಸೌಂದರ್ಯವರ್ಧಕ ಇದು.',
  },
  texture: {
    en: 'For uneven texture, a light gel layer is an easy first step before heavier creams.',
    ml: 'അസമമായ പ്രതലത്തിന്, കനത്ത ക്രീമുകൾക്ക് മുൻപ് ലഘുവായ ജെൽ പാളി എളുപ്പമുള്ള ആദ്യ ഘട്ടമാണ്.',
    hi: 'असमान बनावट के लिए, भारी क्रीम से पहले हल्की जेल परत आसान पहला कदम है।',
    ta: 'சீரற்ற அமைப்புக்கு, கனமான கிரீம்களுக்கு முன் இலகுவான ஜெல் அடுக்கு எளிய முதல் படி.',
    kn: 'ಅಸಮ ರಚನೆಗೆ, ಭಾರವಾದ ಕ್ರೀಮ್‌ಗಳ ಮೊದಲು ಹಗುರ ಜೆಲ್ ಪದರ ಸುಲಭ ಮೊದಲ ಹೆಜ್ಜೆ.',
  },
  soothing: {
    en: 'You described easily irritated skin, so patch-testing matters more than ever before using this.',
    ml: 'എളുപ്പം പ്രകോപിതമാകുന്ന ചർമ്മം പറഞ്ഞതിനാൽ, ഇത് ഉപയോഗിക്കുന്നതിന് മുൻപ് പാച്ച് ടെസ്റ്റ് ഏറ്റവും പ്രധാനമാണ്.',
    hi: 'आपने जल्दी चिढ़ने वाली त्वचा बताई, इसलिए इसके उपयोग से पहले पैच टेस्ट पहले से ज़्यादा ज़रूरी है।',
    ta: 'எளிதில் எரிச்சலடையும் சருமம் என்றதால், இதைப் பயன்படுத்தும் முன் பேட்ச் டெஸ்ட் மிக முக்கியம்.',
    kn: 'ಸುಲಭವಾಗಿ ಕೆರಳುವ ಚರ್ಮ ಎಂದದ್ದರಿಂದ, ಇದನ್ನು ಬಳಸುವ ಮೊದಲು ಪ್ಯಾಚ್ ಟೆಸ್ಟ್ ಹೆಚ್ಚು ಮುಖ್ಯ.',
  },
  baby: {
    en: 'A gentle baby-care step for the softest skin in the house.',
    ml: 'വീട്ടിലെ ഏറ്റവും മൃദുലമായ ചർമ്മത്തിനുള്ള സൗമ്യമായ ശിശു പരിചരണ ഘട്ടം.',
    hi: 'घर की सबसे कोमल त्वचा के लिए सौम्य शिशु देखभाल कदम।',
    ta: 'வீட்டின் மிக மென்மையான சருமத்திற்கான மென்மையான குழந்தை பராமரிப்பு படி.',
    kn: 'ಮನೆಯ ಅತ್ಯಂತ ಮೃದು ಚರ್ಮಕ್ಕೆ ಸೌಮ್ಯ ಮಗು ಆರೈಕೆ ಹೆಜ್ಜೆ.',
  },
  wellness: {
    en: 'You asked for both, so this is the wellness side of the catalogue.',
    ml: 'രണ്ടും ആവശ്യപ്പെട്ടതിനാൽ, കാറ്റലോഗിലെ ആരോഗ്യവശം ഇതാണ്.',
    hi: 'आपने दोनों माँगा, इसलिए यह कैटलॉग का वेलनेस पक्ष है।',
    ta: 'இரண்டும் கேட்டதால், பட்டியலின் ஆரோக்கியப் பகுதி இது.',
    kn: 'ಎರಡೂ ಕೇಳಿದ್ದರಿಂದ, ಪಟ್ಟಿಯ ಆರೋಗ್ಯ ಭಾಗ ಇದು.',
  },
  skin: {
    en: 'A skin-and-body step from the current catalogue that complements the picks above.',
    ml: 'മുകളിലുള്ള തിരഞ്ഞെടുപ്പുകൾക്കൊപ്പം ചേരുന്ന, നിലവിലെ കാറ്റലോഗിലെ ഒരു ചർമ്മ-ശരീര പരിചരണ ഘട്ടം.',
    hi: 'ऊपर के चयनों के साथ मेल खाने वाला, मौजूदा कैटलॉग से त्वचा और शरीर देखभाल का कदम।',
    ta: 'மேலே உள்ள தேர்வுகளுடன் சேரும், தற்போதைய பட்டியலிலிருந்து சரும-உடல் பராமரிப்புப் படி.',
    kn: 'ಮೇಲಿನ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಹೊಂದುವ, ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಿಂದ ಚರ್ಮ-ದೇಹ ಆರೈಕೆ ಹೆಜ್ಜೆ.',
  },
  hair: {
    en: 'A hair-care step from the current catalogue that complements the picks above.',
    ml: 'മുകളിലുള്ള തിരഞ്ഞെടുപ്പുകൾക്കൊപ്പം ചേരുന്ന, നിലവിലെ കാറ്റലോഗിലെ ഒരു മുടി പരിചരണ ഘട്ടം.',
    hi: 'ऊपर के चयनों के साथ मेल खाने वाला, मौजूदा कैटलॉग से बालों की देखभाल का कदम।',
    ta: 'மேலே உள்ள தேர்வுகளுடன் சேரும், தற்போதைய பட்டியலிலிருந்து முடி பராமரிப்புப் படி.',
    kn: 'ಮೇಲಿನ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಹೊಂದುವ, ಪ್ರಸುತ್ತ ಪಟ್ಟಿಯಿಂದ ಕೂದಲು ಆರೈಕೆ ಹೆಜ್ಜೆ.',
  },
  default: {
    en: 'A well-rounded starting point from the current Mariyas catalogue.',
    ml: 'നിലവിലെ മരിയാസ് കാറ്റലോഗിലെ സമഗ്രമായ ഒരു തുടക്കം.',
    hi: 'मौजूदा मरियास कैटलॉग से एक संतुलित शुरुआत।',
    ta: 'தற்போதைய மரியாஸ் பட்டியலிலிருந்து சமநிலையான தொடக்கம்.',
    kn: 'ಪ್ರಸುತ್ತ ಮರಿಯಾಸ್ ಪಟ್ಟಿಯಿಂದ ಸಮತೋಲಿತ ಆರಂಭ.',
  },
};
