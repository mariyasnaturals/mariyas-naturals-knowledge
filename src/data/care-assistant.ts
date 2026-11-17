/**
 * "Chat with Mariyas" — the care assistant's entire vocabulary, in five languages.
 *
 * The assistant is deterministic and offline: it looks up the verified facts in
 * `src/data/care-knowledge.json` (read from the official store on 2026-11-16) and
 * answers with a template. There is no model, no network call and no free-text
 * generation, so it cannot invent an ingredient, a price or a health claim. When
 * the answer is not in the verified data it says so and links to the official
 * listing instead of guessing.
 *
 * Product names, prices and directions stay in the store's own English wording —
 * they are quotations of the listing, not marketing copy we are free to rewrite.
 */
import type { Locale } from '../i18n';

export interface AssistantCopy {
  /** Visible trigger label. */
  label: string;
  eyebrow: string;
  title: string;
  intro: string;
  placeholder: string;
  send: string;
  close: string;
  disclaimer: string;
  /** Read out to screen readers when a new answer arrives. */
  newAnswer: string;
  chips: readonly string[];
  answers: {
    greet: string;
    found: string;
    price: string;
    noPrice: string;
    inStock: string;
    outOfStock: string;
    size: string;
    use: string;
    noUse: string;
    ingredients: string;
    noIngredients: string;
    safety: string;
    shipping: string;
    manufacture: string;
    shopping: string;
    contact: string;
    notFound: string;
    seeListing: string;
    category: string;
    more: string;
  };
}

export const assistantCopy: Record<Locale, AssistantCopy> = {
  en: {
    label: 'Chat with Mariyas',
    eyebrow: 'Care assistant',
    title: 'Chat with Mariyas',
    intro:
      'Ask about a product in the catalogue — its size, price, availability or what its official listing says. Answers quote the store listing; nothing here is a medical opinion.',
    placeholder: 'Ask about a product or a concern',
    send: 'Ask',
    close: 'Close the assistant',
    disclaimer:
      'A guide to the published catalogue, not medical advice. For pregnancy, an infant, an allergy or a condition, ask a qualified practitioner.',
    newAnswer: 'New answer',
    chips: [
      'Hair oil',
      'Baby care',
      'Shampoo',
      'Prices',
      'Delivery and returns',
    ],
    answers: {
      greet:
        'Hello. I can look up any product in the current Mariyas Naturals catalogue and tell you its official pack size, price, availability and what the listing says it is for. What would you like to know?',
      found: '{summary}',
      price: 'The official listing price is {price}.',
      noPrice:
        'The official listing does not publish a price for this item yet.',
      inStock: 'It is in stock on the official store today.',
      outOfStock:
        'The official store shows it as currently unavailable. The listing stays the authority; check it before travelling.',
      size: 'Pack size: {size}.',
      use: 'What the official listing says: {details}',
      noUse:
        'The official listing does not spell out directions for this item, so I will not write any. The full directions, ingredients and cautions are on the product page.',
      ingredients:
        'The store listing, which carries the full ingredient list, is the only place I will quote from: {details}',
      noIngredients:
        'I do not hold a verified ingredient list for this item. The complete list is printed on the pack and published on the official listing.',
      safety:
        'I cannot advise on pregnancy, infants, allergies or a medical condition. Please ask a qualified practitioner, and read the cautions on the pack and the official listing before use.',
      shipping:
        'Shipping, delivery times, returns and payment are handled by the official store at checkout — this site never takes an order. Open the store to read the current terms.',
      manufacture:
        'Mariyas Naturals is a family business in Alappuzha district, Kerala, and the oil is made and dispatched from there — the address is printed on the pack and published in the footer of every page. I do not hold a facility licence or a production figure, so I will not quote one; those documents belong on the certifications page once they have been verified.',
      shopping:
        'Orders, prices, delivery and payment are handled on www.mariyasnaturals.com, never here. Whether the store ships to your country, and at what cost, is set at checkout — I do not hold a verified list of international destinations, so I will not guess one.',
      contact:
        'The fastest route to the family is WhatsApp. You can also write an email; both links are in the footer of every page.',
      notFound:
        'I could not match that to a product in the current catalogue. Try a product name, a category such as hair care, baby care or powders, or pick one of the suggestions below.',
      seeListing: 'Open the official listing',
      category: 'In {category}: {list}.',
      more: 'Also available: {list}.',
    },
  },
  ml: {
    label: 'മാരിയാസിനോട് സംസാരിക്കൂ',
    eyebrow: 'പരിചരണ സഹായി',
    title: 'മാരിയാസിനോട് സംസാരിക്കൂ',
    intro:
      'കാറ്റലോഗിലെ ഏതെങ്കിലും ഉൽപ്പന്നത്തെക്കുറിച്ച് ചോദിക്കൂ — വലിപ്പം, വില, ലഭ്യത അല്ലെങ്കിൽ ഔദ്യോഗിക ലിസ്റ്റിംഗ് പറയുന്നത്. ഉത്തരങ്ങൾ സ്റ്റോർ ലിസ്റ്റിംഗിൽ നിന്നുള്ള ഉദ്ധരണികളാണ്; ഇവിടെ ഒന്നും വൈദ്യോപദേശമല്ല.',
    placeholder: 'ഒരു ഉൽപ്പന്നത്തെയോ ആശങ്കയെയോ കുറിച്ച് ചോദിക്കൂ',
    send: 'ചോദിക്കൂ',
    close: 'സഹായി അടയ്ക്കൂ',
    disclaimer:
      'പ്രസിദ്ധീകരിച്ച കാറ്റലോഗിന്റെ വഴികാട്ടി മാത്രം, വൈദ്യോപദേശമല്ല. ഗർഭാവസ്ഥ, കുഞ്ഞ്, അലർജി അല്ലെങ്കിൽ ഏതെങ്കിലും രോഗാവസ്ഥ എന്നിവയ്ക്ക് യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കൂ.',
    newAnswer: 'പുതിയ ഉത്തരം',
    chips: ['ഹെയർ ഓയിൽ', 'ബേബി കെയർ', 'ഷാംപൂ', 'വില', 'ഡെലിവറിയും മടക്കവും'],
    answers: {
      greet:
        'നമസ്കാരം. നിലവിലെ മാരിയാസ് നാച്ചുറൽസ് കാറ്റലോഗിലെ ഏത് ഉൽപ്പന്നവും — ഔദ്യോഗിക പായ്ക്ക് വലിപ്പം, വില, ലഭ്യത, ലിസ്റ്റിംഗ് പറയുന്ന ഉപയോഗം — എന്നിവ ഞാൻ പറഞ്ഞുതരാം. എന്താണ് അറിയേണ്ടത്?',
      found: '{summary}',
      price: 'ഔദ്യോഗിക ലിസ്റ്റിംഗ് വില {price} ആണ്.',
      noPrice:
        'ഈ ഇനത്തിന് ഔദ്യോഗിക ലിസ്റ്റിംഗിൽ ഇതുവരെ വില പ്രസിദ്ധീകരിച്ചിട്ടില്ല.',
      inStock: 'ഇന്ന് ഔദ്യോഗിക സ്റ്റോറിൽ ഇത് ലഭ്യമാണ്.',
      outOfStock:
        'ഔദ്യോഗിക സ്റ്റോർ ഇത് ഇപ്പോൾ ലഭ്യമല്ലെന്ന് കാണിക്കുന്നു. ലിസ്റ്റിംഗ് തന്നെയാണ് അവസാന വാക്ക്; യാത്രയ്ക്ക് മുമ്പ് പരിശോധിക്കൂ.',
      size: 'പായ്ക്ക് വലിപ്പം: {size}.',
      use: 'ഔദ്യോഗിക ലിസ്റ്റിംഗ് പറയുന്നത്: {details}',
      noUse:
        'ഈ ഇനത്തിന് ഔദ്യോഗിക ലിസ്റ്റിംഗിൽ ഉപയോഗവിധി വ്യക്തമായി നൽകിയിട്ടില്ല, അതിനാൽ ഞാൻ അത് എഴുതുന്നില്ല. പൂർണ്ണ ഉപയോഗവിധിയും ചേരുവകളും മുന്നറിയിപ്പുകളും ഉൽപ്പന്ന പേജിലുണ്ട്.',
      ingredients:
        'പൂർണ്ണ ചേരുവാപ്പട്ടികയുള്ള സ്റ്റോർ ലിസ്റ്റിംഗിൽ നിന്നു മാത്രമേ ഞാൻ ഉദ്ധരിക്കൂ: {details}',
      noIngredients:
        'ഈ ഇനത്തിന് പരിശോധിച്ച ചേരുവാപ്പട്ടിക എന്റെ പക്കലില്ല. പൂർണ്ണ പട്ടിക പായ്ക്കിലും ഔദ്യോഗിക ലിസ്റ്റിംഗിലും ഉണ്ട്.',
      safety:
        'ഗർഭാവസ്ഥ, കുഞ്ഞുങ്ങൾ, അലർജി അല്ലെങ്കിൽ രോഗാവസ്ഥ എന്നിവയിൽ എനിക്ക് ഉപദേശം നൽകാനാവില്ല. യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കൂ; ഉപയോഗത്തിന് മുമ്പ് പായ്ക്കിലെ മുന്നറിയിപ്പുകളും ഔദ്യോഗിക ലിസ്റ്റിംഗും വായിക്കൂ.',
      shipping:
        'ഷിപ്പിംഗ്, ഡെലിവറി സമയം, മടക്കം, പേയ്മെന്റ് എന്നിവ ചെക്ക്ഔട്ടിൽ ഔദ്യോഗിക സ്റ്റോർ കൈകാര്യം ചെയ്യുന്നു — ഈ സൈറ്റ് ഓർഡർ സ്വീകരിക്കുന്നില്ല. നിലവിലെ നിബന്ധനകൾക്ക് സ്റ്റോർ തുറക്കൂ.',
      manufacture:
        'മാരിയാസ് നാച്വറൽസ് കേരളത്തിലെ ആലപ്പുഴ ജില്ലയിലെ ഒരു കുടുംബ സംരംഭമാണ്; ഓയിൽ അവിടെ നിർമ്മിച്ച് അവിടെ നിന്ന് അയയ്ക്കുന്നു — വിലാസം പായ്ക്കറ്റിലും ഓരോ പേജിന്റെയും ഫൂട്ടറിലും ഉണ്ട്. എന്റെ കൈവശം സ്ഥാപനത്തിന്റെ ലൈസൻസോ ഉൽപ്പാദന കണക്കോ ഇല്ല, അതിനാൽ ഞാൻ അത് ഉദ്ധരിക്കില്ല; ആ രേഖകൾ പരിശോധിച്ച ശേഷം സർട്ടിഫിക്കേഷൻ പേജിൽ വരും.',
      shopping:
        'ഓർഡർ, വില, ഡെലിവറി, പേയ്‌മെന്റ് എന്നിവ www.mariyasnaturals.com ൽ മാത്രം. നിങ്ങളുടെ രാജ്യത്തേക്ക് അയയ്ക്കുന്നുണ്ടോ എന്നും ചെലവും ചെക്കൗട്ടിൽ തീരുമാനിക്കും — വിദേശ രാജ്യങ്ങളുടെ ഉറപ്പിച്ച പട്ടിക എന്റെ കൈവശം ഇല്ല, അതിനാൽ ഞാൻ ഊഹിക്കില്ല.',
      contact:
        'കുടുംബത്തെ എളുപ്പത്തിൽ ബന്ധപ്പെടാൻ വാട്സ്ആപ്പ് ആണ് വഴി. ഇമെയിലും ലഭ്യമാണ്; രണ്ട് ലിങ്കുകളും ഓരോ പേജിന്റെയും ഫൂട്ടറിലുണ്ട്.',
      notFound:
        'അത് നിലവിലെ കാറ്റലോഗിലെ ഒരു ഉൽപ്പന്നവുമായി എനിക്ക് ചേർക്കാനായില്ല. ഉൽപ്പന്നത്തിന്റെ പേരോ ഹെയർ കെയർ, ബേബി കെയർ, പൗഡറുകൾ തുടങ്ങിയ വിഭാഗമോ പരീക്ഷിക്കൂ, അല്ലെങ്കിൽ താഴെയുള്ള നിർദ്ദേശങ്ങളിൽ ഒന്ന് തിരഞ്ഞെടുക്കൂ.',
      seeListing: 'ഔദ്യോഗിക ലിസ്റ്റിംഗ് തുറക്കൂ',
      category: '{category} വിഭാഗത്തിൽ: {list}.',
      more: 'കൂടാതെ: {list}.',
    },
  },
  hi: {
    label: 'मारियास से बात करें',
    eyebrow: 'केयर सहायक',
    title: 'मारियास से बात करें',
    intro:
      'कैटलॉग के किसी भी उत्पाद के बारे में पूछें — उसका आकार, कीमत, उपलब्धता या उसकी आधिकारिक लिस्टिंग क्या कहती है। उत्तर स्टोर लिस्टिंग के उद्धरण हैं; यहाँ कुछ भी चिकित्सकीय सलाह नहीं है।',
    placeholder: 'किसी उत्पाद या चिंता के बारे में पूछें',
    send: 'पूछें',
    close: 'सहायक बंद करें',
    disclaimer:
      'यह प्रकाशित कैटलॉग का मार्गदर्शक है, चिकित्सकीय सलाह नहीं। गर्भावस्था, शिशु, एलर्जी या किसी रोग के लिए योग्य चिकित्सक से पूछें।',
    newAnswer: 'नया उत्तर',
    chips: ['हेयर ऑइल', 'बेबी केयर', 'शैम्पू', 'कीमतें', 'डिलीवरी और वापसी'],
    answers: {
      greet:
        'नमस्ते। मैं वर्तमान मारियास नैचुरल्स कैटलॉग के किसी भी उत्पाद का आधिकारिक पैक आकार, कीमत, उपलब्धता और लिस्टिंग में लिखा उपयोग बता सकता हूँ। आप क्या जानना चाहेंगे?',
      found: '{summary}',
      price: 'आधिकारिक लिस्टिंग पर कीमत {price} है।',
      noPrice:
        'इस वस्तु के लिए आधिकारिक लिस्टिंग पर अभी कीमत प्रकाशित नहीं है।',
      inStock: 'यह आज आधिकारिक स्टोर पर उपलब्ध है।',
      outOfStock:
        'आधिकारिक स्टोर इसे अभी अनुपलब्ध दिखाता है। लिस्टिंग ही अंतिम प्रमाण है; जाने से पहले जाँचें।',
      size: 'पैक आकार: {size}।',
      use: 'आधिकारिक लिस्टिंग कहती है: {details}',
      noUse:
        'इस वस्तु के लिए आधिकारिक लिस्टिंग में उपयोग विधि स्पष्ट नहीं है, इसलिए मैं स्वयं नहीं लिखूँगा। पूरी विधि, सामग्री और चेतावनियाँ उत्पाद पृष्ठ पर हैं।',
      ingredients:
        'मैं केवल उस स्टोर लिस्टिंग से उद्धरण दूँगा जिसमें पूरी सामग्री सूची है: {details}',
      noIngredients:
        'इस वस्तु की सत्यापित सामग्री सूची मेरे पास नहीं है। पूरी सूची पैक पर और आधिकारिक लिस्टिंग पर छपी है।',
      safety:
        'गर्भावस्था, शिशुओं, एलर्जी या किसी रोग पर मैं सलाह नहीं दे सकता। कृपया योग्य चिकित्सक से पूछें और उपयोग से पहले पैक तथा आधिकारिक लिस्टिंग की चेतावनियाँ पढ़ें।',
      shipping:
        'शिपिंग, डिलीवरी समय, वापसी और भुगतान आधिकारिक स्टोर चेकआउट पर संभालता है — यह साइट कोई ऑर्डर नहीं लेती। वर्तमान नियम पढ़ने के लिए स्टोर खोलें।',
      manufacture:
        'मारियाज़ नैचुरल्स केरल के अलप्पुझा ज़िले का पारिवारिक व्यवसाय है, और तेल वहीं बनकर वहीं से भेजा जाता है — पता पैक पर छपा है और हर पेज के फ़ुटर में है। मेरे पास सुविधा का लाइसेंस या उत्पादन का आँकड़ा नहीं है, इसलिए मैं उसे उद्धृत नहीं करूँगा; वे दस्तावेज़ जाँच के बाद प्रमाणन पेज पर होंगे।',
      shopping:
        'ऑर्डर, कीमत, डिलीवरी और भुगतान www.mariyasnaturals.com पर होते हैं, यहाँ नहीं। स्टोर आपके देश में भेजता है या नहीं और कितने खर्च में, यह चेकआउट पर तय होता है — अंतरराष्ट्रीय गंतव्यों की सत्यापित सूची मेरे पास नहीं है, इसलिए मैं अनुमान नहीं लगाऊँगा।',
      contact:
        'परिवार से संपर्क का सबसे तेज़ रास्ता व्हाट्सएप है। ईमेल भी उपलब्ध है; दोनों लिंक हर पृष्ठ के फुटर में हैं।',
      notFound:
        'मैं इसे वर्तमान कैटलॉग के किसी उत्पाद से नहीं जोड़ सका। उत्पाद का नाम, या हेयर केयर, बेबी केयर, पाउडर जैसी श्रेणी आज़माएँ, या नीचे दिए सुझावों में से चुनें।',
      seeListing: 'आधिकारिक लिस्टिंग खोलें',
      category: '{category} में: {list}।',
      more: 'ये भी उपलब्ध: {list}।',
    },
  },
  ta: {
    label: 'மாரியாஸுடன் பேசுங்கள்',
    eyebrow: 'பராமரிப்பு உதவியாளர்',
    title: 'மாரியாஸுடன் பேசுங்கள்',
    intro:
      'பட்டியலில் உள்ள எந்தத் தயாரிப்பைப் பற்றியும் கேளுங்கள் — அளவு, விலை, இருப்பு அல்லது அதிகாரப்பூர்வ பட்டியல் கூறுவது. பதில்கள் கடைப் பட்டியலின் மேற்கோள்கள்; இங்கு எதுவும் மருத்துவ ஆலோசனை அல்ல.',
    placeholder: 'ஒரு தயாரிப்பு அல்லது கவலை பற்றிக் கேளுங்கள்',
    send: 'கேள்',
    close: 'உதவியாளரை மூடு',
    disclaimer:
      'இது வெளியிடப்பட்ட பட்டியலுக்கான வழிகாட்டி, மருத்துவ ஆலோசனை அல்ல. கர்ப்பம், குழந்தை, ஒவ்வாமை அல்லது நோய்க்கு தகுதியான மருத்துவரை அணுகுங்கள்.',
    newAnswer: 'புதிய பதில்',
    chips: [
      'ஹேர் ஆயில்',
      'குழந்தை பராமரிப்பு',
      'ஷாம்பூ',
      'விலைகள்',
      'டெலிவரி மற்றும் திருப்பம்',
    ],
    answers: {
      greet:
        'வணக்கம். தற்போதைய மாரியாஸ் நேச்சுரல்ஸ் பட்டியலில் உள்ள எந்தத் தயாரிப்பின் அதிகாரப்பூர்வ அளவு, விலை, இருப்பு, பட்டியல் கூறும் பயன்பாடு ஆகியவற்றைச் சொல்ல முடியும். என்ன அறிய விரும்புகிறீர்கள்?',
      found: '{summary}',
      price: 'அதிகாரப்பூர்வ பட்டியல் விலை {price}.',
      noPrice:
        'இந்தப் பொருளுக்கு அதிகாரப்பூர்வ பட்டியலில் இன்னும் விலை வெளியிடப்படவில்லை.',
      inStock: 'இன்று அதிகாரப்பூர்வ கடையில் இது இருப்பில் உள்ளது.',
      outOfStock:
        'அதிகாரப்பூர்வ கடை இதை இப்போது கிடைக்காததாகக் காட்டுகிறது. பட்டியலே இறுதி ஆதாரம்; புறப்படும் முன் சரிபார்க்கவும்.',
      size: 'பாக் அளவு: {size}.',
      use: 'அதிகாரப்பூர்வ பட்டியல் கூறுவது: {details}',
      noUse:
        'இந்தப் பொருளுக்கு அதிகாரப்பூர்வ பட்டியலில் பயன்பாட்டு முறை தெளிவாக இல்லை, எனவே நான் எழுதமாட்டேன். முழு முறை, பொருட்கள், எச்சரிக்கைகள் தயாரிப்புப் பக்கத்தில் உள்ளன.',
      ingredients:
        'முழுப் பொருள் பட்டியல் உள்ள கடைப் பட்டியலில் இருந்து மட்டுமே மேற்கோள் தருவேன்: {details}',
      noIngredients:
        'இந்தப் பொருளுக்கு சரிபார்க்கப்பட்ட பொருள் பட்டியல் என்னிடம் இல்லை. முழுப் பட்டியல் பாக்கிலும் அதிகாரப்பூர்வ பட்டியலிலும் உள்ளது.',
      safety:
        'கர்ப்பம், குழந்தைகள், ஒவ்வாமை அல்லது நோய் குறித்து என்னால் ஆலோசனை தர முடியாது. தகுதியான மருத்துவரை அணுகி, பயன்படுத்தும் முன் பாக் மற்றும் அதிகாரப்பூர்வ பட்டியலின் எச்சரிக்கைகளைப் படியுங்கள்.',
      shipping:
        'ஷிப்பிங், டெலிவரி நேரம், திருப்பம், பணம் செலுத்துதல் ஆகியவற்றை அதிகாரப்பூர்வ கடை செக்அவுட்டில் கையாள்கிறது — இந்தத் தளம் ஆர்டர் எடுக்காது. தற்போதைய விதிகளுக்கு கடையைத் திறக்கவும்.',
      manufacture:
        'மரியாஸ் நேச்சுரல்ஸ் கேரளாவின் ஆலப்புழா மாவட்டத்தில் உள்ள குடும்ப நிறுவனம்; எண்ணெய் அங்கேயே தயாராகி அங்கிருந்து அனுப்பப்படுகிறது — முகவரி பேக்கிலும் ஒவ்வொரு பக்கத்தின் அடிப்பகுதியிலும் உள்ளது. என்னிடம் நிறுவன உரிமமோ உற்பத்தி எண்ணிக்கையோ இல்லை, எனவே அதை மேற்கோள் காட்ட மாட்டேன்; அந்த ஆவணங்கள் சரிபார்ப்புக்குப் பின் சான்றிதழ் பக்கத்தில் இருக்கும்.',
      shopping:
        'ஆர்டர், விலை, விநியோகம், பணம் செலுத்துதல் ஆகியவை www.mariyasnaturals.com இல் மட்டுமே. உங்கள் நாட்டுக்கு அனுப்புகிறதா, எவ்வளவு செலவில் என்பதை செக்அவுட் தீர்மானிக்கும் — வெளிநாட்டு இடங்களின் சரிபார்க்கப்பட்ட பட்டியல் என்னிடம் இல்லை, எனவே ஊகிக்க மாட்டேன்.',
      contact:
        'குடும்பத்தைத் தொடர்பு கொள்ள எளிதான வழி வாட்ஸ்அப். மின்னஞ்சலும் உள்ளது; இரண்டு இணைப்புகளும் ஒவ்வொரு பக்கத்தின் அடிக்குறிப்பில் உள்ளன.',
      notFound:
        'அதை தற்போதைய பட்டியலில் உள்ள தயாரிப்புடன் இணைக்க முடியவில்லை. தயாரிப்பின் பெயரோ, ஹேர் கேர், குழந்தை பராமரிப்பு, பொடிகள் போன்ற வகையோ முயற்சிக்கவும், அல்லது கீழே உள்ள பரிந்துரைகளில் ஒன்றைத் தேர்ந்தெடுக்கவும்.',
      seeListing: 'அதிகாரப்பூர்வ பட்டியலைத் திற',
      category: '{category} இல்: {list}.',
      more: 'மேலும்: {list}.',
    },
  },
  kn: {
    label: 'ಮಾರಿಯಾಸ್ ಜೊತೆ ಮಾತನಾಡಿ',
    eyebrow: 'ಆರೈಕೆ ಸಹಾಯಕ',
    title: 'ಮಾರಿಯಾಸ್ ಜೊತೆ ಮಾತನಾಡಿ',
    intro:
      'ಪಟ್ಟಿಯಲ್ಲಿರುವ ಯಾವುದೇ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ಕೇಳಿ — ಅದರ ಗಾತ್ರ, ಬೆಲೆ, ಲಭ್ಯತೆ ಅಥವಾ ಅಧಿಕೃತ ಪಟ್ಟಿ ಏನು ಹೇಳುತ್ತದೆ. ಉತ್ತರಗಳು ಅಂಗಡಿ ಪಟ್ಟಿಯ ಉಲ್ಲೇಖಗಳು; ಇಲ್ಲಿ ಯಾವುದೂ ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ.',
    placeholder: 'ಉತ್ಪನ್ನ ಅಥವಾ ಕಾಳಜಿಯ ಬಗ್ಗೆ ಕೇಳಿ',
    send: 'ಕೇಳಿ',
    close: 'ಸಹಾಯಕವನ್ನು ಮುಚ್ಚಿ',
    disclaimer:
      'ಇದು ಪ್ರಕಟಿತ ಪಟ್ಟಿಯ ಮಾರ್ಗದರ್ಶಿ, ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ. ಗರ್ಭಧಾರಣೆ, ಶಿಶು, ಅಲರ್ಜಿ ಅಥವಾ ಕಾಯಿಲೆಗೆ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    newAnswer: 'ಹೊಸ ಉತ್ತರ',
    chips: [
      'ಹೇರ್ ಆಯಿಲ್',
      'ಮಗು ಆರೈಕೆ',
      'ಶಾಂಪೂ',
      'ಬೆಲೆಗಳು',
      'ಡೆಲಿವರಿ ಮತ್ತು ವಾಪಸಾತಿ',
    ],
    answers: {
      greet:
        'ನಮಸ್ಕಾರ. ಪ್ರಸ್ತುತ ಮಾರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಪಟ್ಟಿಯಲ್ಲಿರುವ ಯಾವುದೇ ಉತ್ಪನ್ನದ ಅಧಿಕೃತ ಪ್ಯಾಕ್ ಗಾತ್ರ, ಬೆಲೆ, ಲಭ್ಯತೆ ಮತ್ತು ಪಟ್ಟಿ ಹೇಳುವ ಬಳಕೆಯನ್ನು ತಿಳಿಸಬಲ್ಲೆ. ಏನು ತಿಳಿಯಬೇಕು?',
      found: '{summary}',
      price: 'ಅಧಿಕೃತ ಪಟ್ಟಿಯ ಬೆಲೆ {price}.',
      noPrice: 'ಈ ವಸ್ತುವಿಗೆ ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಇನ್ನೂ ಬೆಲೆ ಪ್ರಕಟವಾಗಿಲ್ಲ.',
      inStock: 'ಇಂದು ಅಧಿಕೃತ ಅಂಗಡಿಯಲ್ಲಿ ಇದು ಲಭ್ಯವಿದೆ.',
      outOfStock:
        'ಅಧಿಕೃತ ಅಂಗಡಿ ಇದನ್ನು ಸದ್ಯ ಲಭ್ಯವಿಲ್ಲ ಎಂದು ತೋರಿಸುತ್ತದೆ. ಪಟ್ಟಿಯೇ ಅಂತಿಮ ಆಧಾರ; ಹೊರಡುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.',
      size: 'ಪ್ಯಾಕ್ ಗಾತ್ರ: {size}.',
      use: 'ಅಧಿಕೃತ ಪಟ್ಟಿ ಹೇಳುವುದು: {details}',
      noUse:
        'ಈ ವಸ್ತುವಿಗೆ ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಬಳಕೆಯ ವಿಧಾನ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ, ಹಾಗಾಗಿ ನಾನು ಬರೆಯುವುದಿಲ್ಲ. ಪೂರ್ಣ ವಿಧಾನ, ಪದಾರ್ಥಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು ಉತ್ಪನ್ನ ಪುಟದಲ್ಲಿವೆ.',
      ingredients:
        'ಪೂರ್ಣ ಪದಾರ್ಥ ಪಟ್ಟಿ ಇರುವ ಅಂಗಡಿ ಪಟ್ಟಿಯಿಂದ ಮಾತ್ರ ಉಲ್ಲೇಖ ನೀಡುತ್ತೇನೆ: {details}',
      noIngredients:
        'ಈ ವಸ್ತುವಿನ ಪರಿಶೀಲಿತ ಪದಾರ್ಥ ಪಟ್ಟಿ ನನ್ನ ಬಳಿ ಇಲ್ಲ. ಪೂರ್ಣ ಪಟ್ಟಿ ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಮತ್ತು ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಇದೆ.',
      safety:
        'ಗರ್ಭಧಾರಣೆ, ಶಿಶುಗಳು, ಅಲರ್ಜಿ ಅಥವಾ ಕಾಯಿಲೆ ಬಗ್ಗೆ ನಾನು ಸಲಹೆ ನೀಡಲಾರೆ. ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ; ಬಳಕೆಯ ಮೊದಲು ಪ್ಯಾಕ್ ಮತ್ತು ಅಧಿಕೃತ ಪಟ್ಟಿಯ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಓದಿ.',
      shipping:
        'ಶಿಪ್ಪಿಂಗ್, ಡೆಲಿವರಿ ಸಮಯ, ವಾಪಸಾತಿ ಮತ್ತು ಪಾವತಿಯನ್ನು ಅಧಿಕೃತ ಅಂಗಡಿ ಚೆಕ್‌ಔಟ್‌ನಲ್ಲಿ ನಿರ್ವಹಿಸುತ್ತದೆ — ಈ ತಾಣ ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ. ಪ್ರಸ್ತುತ ನಿಯಮಗಳಿಗೆ ಅಂಗಡಿ ತೆರೆಯಿರಿ.',
      manufacture:
        'ಮಾರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಕೇರಳದ ಅಲಪ್ಪುಳ ಜಿಲ್ಲೆಯ ಕುಟುಂಬ ಉದ್ಯಮ; ಎಣ್ಣೆ ಅಲ್ಲೇ ತಯಾರಾಗಿ ಅಲ್ಲಿಂದಲೇ ರವಾನೆಯಾಗುತ್ತದೆ — ವಿಳಾಸ ಪ್ಯಾಕ್‌ನಲ್ಲೂ ಪ್ರತಿ ಪುಟದ ಕೆಳಭಾಗದಲ್ಲೂ ಇದೆ. ನನ್ನ ಬಳಿ ಸ್ಥಾವರ ಪರವಾನಗಿ ಅಥವಾ ಉತ್ಪಾದನಾ ಅಂಕಿ ಇಲ್ಲ, ಹಾಗಾಗಿ ಅದನ್ನು ಉಲ್ಲೇಖಿಸುವುದಿಲ್ಲ; ಆ ದಾಖಲೆಗಳು ಪರಿಶೀಲನೆಯ ನಂತರ ಪ್ರಮಾಣೀಕರಣ ಪುಟದಲ್ಲಿರುತ್ತವೆ.',
      shopping:
        'ಆರ್ಡರ್, ಬೆಲೆ, ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ www.mariyasnaturals.com ನಲ್ಲೇ. ನಿಮ್ಮ ದೇಶಕ್ಕೆ ರವಾನೆ ಇದೆಯೇ ಮತ್ತು ಎಷ್ಟು ವೆಚ್ಚ ಎಂಬುದನ್ನು ಚೆಕ್‌ಔಟ್ ನಿರ್ಧರಿಸುತ್ತದೆ — ಅಂತಾರಾಷ್ಟ್ರೀಯ ಗಮ್ಯಸ್ಥಾನಗಳ ದೃಢೀಕೃತ ಪಟ್ಟಿ ನನ್ನ ಬಳಿ ಇಲ್ಲ, ಹಾಗಾಗಿ ಊಹಿಸುವುದಿಲ್ಲ.',
      contact:
        'ಕುಟುಂಬವನ್ನು ಸಂಪರ್ಕಿಸಲು ಸುಲಭ ದಾರಿ ವಾಟ್ಸಪ್. ಇಮೇಲ್ ಸಹ ಇದೆ; ಎರಡೂ ಕೊಂಡಿಗಳು ಪ್ರತಿ ಪುಟದ ಪಾದದಲ್ಲಿವೆ.',
      notFound:
        'ಅದನ್ನು ಪ್ರಸ್ತುತ ಪಟ್ಟಿಯ ಉತ್ಪನ್ನಕ್ಕೆ ಹೊಂದಿಸಲಾಗಲಿಲ್ಲ. ಉತ್ಪನ್ನದ ಹೆಸರು, ಅಥವಾ ಹೇರ್ ಕೇರ್, ಮಗು ಆರೈಕೆ, ಪುಡಿಗಳಂತಹ ವರ್ಗವನ್ನು ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಕೆಳಗಿನ ಸಲಹೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ.',
      seeListing: 'ಅಧಿಕೃತ ಪಟ್ಟಿ ತೆರೆಯಿರಿ',
      category: '{category} ನಲ್ಲಿ: {list}.',
      more: 'ಇವೂ ಲಭ್ಯ: {list}.',
    },
  },
};
