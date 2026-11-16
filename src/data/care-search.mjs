/**
 * Deterministic lookup for the "Chat with Mariyas" care assistant.
 *
 * Pure functions over the verified catalogue — no network, no model, no string
 * generation beyond the localised templates. Keeping this as plain JavaScript
 * (with JSDoc types) lets `tests/care-assistant.test.mjs` exercise exactly the
 * code the browser runs.
 */

/** Letters, digits and combining marks of any script; the rest separates tokens. */
const SEPARATORS = /[^\p{L}\p{N}\p{M}]+/u;

export const normalise = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export const tokenise = (value) =>
  normalise(value)
    .split(SEPARATORS)
    .map((token) => token.replace(/[^\p{L}\p{N}\p{M}]+/gu, ''))
    .filter((token) => token.length > 0);

/** Words that carry no product meaning in a question. */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'it',
  'its',
  'do',
  'does',
  'did',
  'you',
  'your',
  'i',
  'me',
  'my',
  'we',
  'our',
  'of',
  'for',
  'to',
  'in',
  'on',
  'at',
  'and',
  'or',
  'with',
  'what',
  'which',
  'how',
  'when',
  'where',
  'who',
  'can',
  'could',
  'would',
  'should',
  'please',
  'tell',
  'about',
  'have',
  'has',
  'there',
  'this',
  'that',
  'these',
  'those',
  'from',
  'any',
  'some',
  'more',
  'much',
  'many',
  'price',
  'prices',
  'cost',
  'stock',
  'available',
  'availability',
  'use',
  'used',
  'uses',
  'using',
  'safe',
  'safety',
  'size',
  'sizes',
  'pack',
  'packs',
  'ml',
  'g',
  'kg',
  'l',
  'ltr',
  'how',
  'what',
  'question',
  'ask',
  'hello',
  'hi',
  'hey',
  'namaste',
  'ഞാൻ',
  'ആണ്',
  'ന്റെ',
  'ഒരു',
  'എന്ത്',
  'എങ്ങനെ',
  'क्या',
  'है',
  'हैं',
  'का',
  'की',
  'के',
  'என்ன',
  'ஆகும்',
  'ಏನು',
  'ಇದೆ',
  'ಮತ್ತು',
  'ഉം',
  'യും',
  'வும்',
  'ಮತ್ತು',
]);

/**
 * Category words in every interface language, mapped to the catalogue's own
 * category keys. A phrase finds its category even when the query is Malayalam
 * and the catalogue keyword is English.
 */
const CATEGORY_WORDS = {
  'hair-care': [
    'hair',
    'shampoo',
    'തൈലം',
    'தைலம்',
    'oil',
    'comb',
    'scalp',
    'dandruff',
    'hairfall',
    'thali',
    'thailam',
    'മുടി',
    'തല',
    'ഷാംപൂ',
    'എണ്ണ',
    'ചീര',
    'बाल',
    'शैम्पू',
    'तेल',
    'मुंडी',
    'முடி',
    'தலை',
    'ஷாம்பூ',
    'எண்ணெய்',
    'கூದಲು',
    'ತಲೆ',
    'ಶಾಂಪೂ',
    'ಎಣ್ಣೆ',
    'ಕೂದಲು',
  ],
  'baby-care': [
    'baby',
    'infant',
    'child',
    'kids',
    'massage',
    'മസാജ്',
    'मालिश',
    'மசாஜ்',
    'ಮಸಾಜ್',
    'ബേബി',
    'കുഞ്ഞ',
    'ശിശു',
    'बेबी',
    'शिशु',
    'बच्चा',
    'குழந்தை',
    'கைக்குழந்தை',
    'ಮಗು',
    'ಶಿಶು',
  ],
  'skin-care': [
    'skin',
    'face',
    'soap',
    'gel',
    'balm',
    'kajal',
    'darkcircle',
    'പഞ്ചസാര',
    'ചർമ്മ',
    'സോപ്പ',
    'त्वचा',
    'साबुन',
    'சருமம்',
    'சோப்',
    'ಚರ್ಮ',
    'ಸೋಪು',
  ],
  'herbal-powders': [
    'powder',
    'kanji',
    'karkidaka',
    'turmeric',
    'ashwagandha',
    'triphala',
    'reetha',
    'shikkakai',
    'henna',
    'പൗഡർ',
    'काढा',
    'पाउडर',
    'பொடி',
    'ಪುಡಿ',
  ],
  wellness: [
    'ghee',
    'honey',
    'chyavanaprash',
    'chyavan',
    'wellness',
    'നെയ്യ്',
    'തേൻ',
    'घी',
    'शहद',
    'நெய்',
    'ತುಪ್ಪ',
    'ಜೇನು',
  ],
  combo: ['combo', 'kit', 'pack', 'set', 'കിറ്റ്', 'किट', 'கிட்', 'ಕಿಟ್'],
};

const SAFETY_STEMS = [
  'pregnan',
  'breastfeed',
  'allerg',
  'sideeffect',
  'reaction',
  'doctor',
  'medicine',
  'medic',
  'infant',
  'newborn',
  'cure',
  'treat',
  'dose',
  'dosage',
  'ഗർഭ',
  'അലർജി',
  'മരുന്ന',
  'ഡോക്ടർ',
  'गर्भ',
  'एलर्जी',
  'दवा',
  'डॉक्टर',
  'கர்ப்ப',
  'ஒவ்வாமை',
  'மருந்து',
  'மருத்துவ',
  'ಗರ್ಭ',
  'ಅಲರ್ಜಿ',
  'ಔಷಧ',
  'ವೈದ್ಯ',
];

const SAFETY_QUALIFIERS = [
  'safe',
  'safety',
  'ok',
  'okay',
  'use',
  'used',
  'suitable',
  'give',
  'apply',
  'inside',
  'ഉപയോഗ',
  'സുരക്ഷിത',
  'उपयोग',
  'सुरक्षित',
  'பயன்படுத்த',
  'பாதுகாப்ப',
  'ಬಳಸ',
  'ಸುರಕ್ಷಿತ',
];

const INTENT_WORDS = {
  shipping: [
    'ship',
    'shipping',
    'deliver',
    'delivery',
    'courier',
    'return',
    'refund',
    'payment',
    'pay',
    'cod',
    'order',
    'ഷിപ്പിംഗ്',
    'ഡെലിവറി',
    'മടക്ക',
    'पेमेंट',
    'डिलीवरी',
    'शिपिंग',
    'वापसी',
    'விநியோக',
    'டெலிவரி',
    'திருப்ப',
    'ವಿತರಣ',
    'ಡೆಲಿವರಿ',
    'ವಾಪಸಾತಿ',
  ],
  contact: [
    'contact',
    'whatsapp',
    'phone',
    'call',
    'email',
    'address',
    'visit',
    'ഫോൺ',
    'വാട്സ്ആപ്പ്',
    'ഇമെയിൽ',
    'വിലാസം',
    'फोन',
    'व्हाट्सएप',
    'ईमेल',
    'पता',
    'போன்',
    'வாட்ஸ்அப்',
    'மின்னஞ்சல்',
    'முகவரி',
    'ಫೋನ್',
    'ವಾಟ್ಸಪ್',
    'ಇಮೇಲ್',
    'ವಿಳಾಸ',
  ],
  price: [
    'price',
    'cost',
    'rate',
    'much',
    'rupee',
    'cheap',
    'expensive',
    'വില',
    'എത്ര',
    'रुपये',
    'कीमत',
    'दाम',
    'விலை',
    'கட்டண',
    'ಬೆಲೆ',
    'ದರ',
  ],
  stock: [
    'stock',
    'available',
    'availability',
    'unavailable',
    'ഇൻസ്റ്റോക്ക്',
    'ലഭ്യ',
    'स्टॉक',
    'उपलब्ध',
    'இருப்பு',
    'கையிருப்பு',
    'ಲಭ್ಯ',
    'ದಾಸ್ತಾನು',
  ],
  use: [
    'use',
    'usage',
    'apply',
    'applied',
    'direction',
    'directions',
    'method',
    'step',
    'steps',
    'ഉപയോഗ',
    'എങ്ങനെ',
    'उपयोग',
    'कैसे',
    'इस्तेमाल',
    'பயன்படுத்த',
    'எப்படி',
    'ಬಳಸ',
    'ಹೇಗೆ',
  ],
  ingredients: [
    'ingredient',
    'ingredients',
    'contain',
    'contains',
    'made',
    'compose',
    'composition',
    'ചേരുവ',
    'ഘടക',
    'सामग्री',
    'घटक',
    'பொருட்கள்',
    'ಪದಾರ್ಥ',
    'ಘಟಕಾಂಶ',
  ],
};

/**
 * Indic product words the store publishes only in English. A query in Malayalam,
 * Hindi, Tamil or Kannada is translated word-by-word into the store's own
 * vocabulary before scoring, so "മസാജ്" finds "Baby Massage Oil".
 */
const SYNONYMS = new Map(
  Object.entries({
    മസാജ്: 'massage',
    മാലിശ്: 'massage',
    मालिश: 'massage',
    மசாஜ்: 'massage',
    ಮಸಾಜ್: 'massage',
    മുടി: 'hair',
    തല: 'hair',
    बाल: 'hair',
    முடி: 'hair',
    கூದಲು: 'hair',
    ಕೂದಲು: 'hair',
    ತಲೆ: 'hair',
    ഷാംപൂ: 'shampoo',
    शैम्पू: 'shampoo',
    ஷாம்பூ: 'shampoo',
    ಶಾಂಪೂ: 'shampoo',
    എണ്ണ: 'oil',
    തൈലം: 'oil',
    तेल: 'oil',
    எண்ணெய்: 'oil',
    தைலம்: 'oil',
    ಎಣ್ಣೆ: 'oil',
    പൗഡർ: 'powder',
    पाउडर: 'powder',
    பொடி: 'powder',
    ಪುಡಿ: 'powder',
    നെയ്യ്: 'ghee',
    घी: 'ghee',
    நெய்: 'ghee',
    ತುಪ್ಪ: 'ghee',
    ബേബി: 'baby',
    ശിശു: 'baby',
    बेबी: 'baby',
    शिशु: 'baby',
    குழந்தை: 'baby',
    ಮಗು: 'baby',
  }),
);

/** Stems found anywhere inside a token, so inflections still match. */
const matches = (token, stems) => stems.some((stem) => token.includes(stem));

export function detectIntents(query) {
  const tokens = tokenise(query);
  const joined = normalise(query).replace(/\s+/g, ' ');
  const found = new Set();
  const has = (stems) => tokens.some((token) => matches(token, stems));
  const safety = has(SAFETY_STEMS);
  const qualifier = has(SAFETY_QUALIFIERS);
  // "Baby hair oil" is a product, "is it safe for a baby" is a caution.
  const childCare = tokens.some((token) =>
    matches(token, [
      'baby',
      'child',
      'kid',
      'ബേബി',
      'കുഞ്ഞ',
      'बेबी',
      'बच्चा',
      'குழந்தை',
      'ಮಗು',
    ]),
  );
  if (safety || (childCare && (qualifier || joined.includes('?'))))
    found.add('safety');
  for (const [intent, words] of Object.entries(INTENT_WORDS))
    if (tokens.some((token) => matches(token, words))) found.add(intent);
  return [...found];
}

const scoreProduct = (product, tokens, query) => {
  const name = normalise(product.name);
  let score = 0;
  if (name.includes(normalise(query))) score += 8;
  for (const token of tokens) {
    if (token.length < 2 && !/\d/.test(token)) continue;
    if (name === token) score += 6;
    else if (name.includes(token)) score += 4;
    for (const keyword of product.keywords) {
      if (keyword === token) score += 3;
      else if (keyword.startsWith(token) || token.startsWith(keyword))
        score += 2;
      else if (keyword.includes(token)) score += 1;
    }
    if (product.category.includes(token)) score += 2;
    if (product.packSize && normalise(product.packSize).includes(token))
      score += 3;
  }
  // Categories are matched as phrases so "hair care" beats a stray "hair".
  for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
    if (category !== product.category) continue;
    if (words.some((word) => normalise(query).includes(normalise(word))))
      score += 3;
  }
  return score;
};

/**
 * Products that answer the question, best first. `products` is the client index
 * built from `care-knowledge.json`.
 */
export function searchProducts(products, query, limit = 3) {
  const original = normalise(query).trim();
  if (!original) return [];
  const translated = tokenise(original)
    .map((token) => SYNONYMS.get(token) ?? token)
    .join(' ');
  const clean = translated || original;
  const tokens = tokenise(clean).filter(
    (token) => !STOPWORDS.has(token) && !/^\d{4,}$/.test(token),
  );
  const ranked = products
    .map((product) => ({
      product,
      score: scoreProduct(product, tokens.length ? tokens : [clean], clean),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.product.mediaId)) -
          Number(Boolean(a.product.mediaId)) ||
        a.product.name.localeCompare(b.product.name),
    );
  return ranked.slice(0, limit).map((entry) => entry.product);
}

/** Store prices are published in minor units; render them without inventing one. */
export function formatMoney(minor, minorUnit, currencyCode) {
  if (minor === null || minor === undefined || !Number.isFinite(Number(minor)))
    return null;
  const amount = Number(minor) / 10 ** Number(minorUnit ?? 2);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currencyCode || 'INR'} ${amount}`;
  }
}
