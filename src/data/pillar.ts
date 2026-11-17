/**
 * The Hair Oil guide — the `.in` pillar page for the brand's most important
 * product, written for this site and not copied from the store listing.
 *
 * Rules held throughout:
 *   - no ingredient count, no ingredient names, no concentrations: the
 *     formulation is still being verified against the pack (see
 *     `knowledge-gates.ts`, claim `hair-oil-60-ingredients`);
 *   - no regrowth, cure or treatment claim of any kind;
 *   - every purchase link points at the exact `.com` product page;
 *   - reviews are quoted verbatim, attributed, and described as opinions.
 *
 * The body text is original educational copy in five languages. Product names,
 * pack sizes and store URLs stay in the store's own English wording, because
 * they are quotations of the listing rather than marketing copy we may rewrite.
 */
import type { Locale } from '../i18n';
import { storeLinks } from './store';
import { customerReviews } from './customer-reviews';

export interface PillarSection {
  id: string;
  heading: string;
  body: readonly string[];
}

export interface PillarCopy {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  sections: readonly PillarSection[];
  sizesHeading: string;
  sizesNote: string;
  sizes: readonly {
    label: string;
    volume: string;
    note: string;
    href: string;
  }[];
  evidenceHeading: string;
  evidenceBody: string;
  reviewsHeading: string;
  reviewsNote: string;
  faqHeading: string;
  faq: readonly { q: string; a: string }[];
  ctaHeading: string;
  ctaBody: string;
  ctaLabel: string;
  backToCollection: string;
  productPage: string;
}

const sizes = (labels: { note200: string; note500: string }) => [
  {
    label: '200 ml',
    volume: '200 ml',
    note: labels.note200,
    href: storeLinks.hairOil200,
  },
  {
    label: '500 ml',
    volume: '500 ml',
    note: labels.note500,
    href: storeLinks.hairOil500,
  },
];

/** Only the fields the page needs from a review; keeps the quote verbatim. */
export const pillarReviews = customerReviews.map((review) => ({
  author: review.author,
  rating: review.rating,
  text: review.text,
}));

export const pillarCopy: Readonly<Record<Locale, PillarCopy>> = {
  en: {
    title: 'Hair oil guide: 200 ml and 500 ml editions',
    description:
      'A guide to the Mariyas Herbal Hair Care Oil: what the label says, the 200 ml and 500 ml packs, how to use it, and where to buy on www.mariyasnaturals.com.',
    eyebrow: 'The hair oil',
    heading: 'The Mariyas Herbal Hair Care Oil',
    lede: 'Two editions of one formulation, made in Alappuzha, Kerala, and sold on our official store. This page gathers everything we can state from the pack and the listing — and says plainly where the record stops.',
    sections: [
      {
        id: 'what-it-is',
        heading: 'What it is',
        body: [
          'The Mariyas Herbal Hair Care Oil is a hair oil for everyday scalp and hair care, sold in a 200 ml and a 500 ml pack. Both packs hold the same formulation; the difference between them is volume.',
          'It is a cosmetic herbal oil. It is not a medicine, it is not a treatment for a scalp condition, and nothing on this page should be read as a promise about hair growth.',
        ],
      },
      {
        id: 'formulation',
        heading: 'What is in it',
        body: [
          'The complete ingredient list is printed on the pack and published on the official product listing, which stays the authority. We deliberately do not reproduce that list here: a paraphrase can drop a caution or reorder an ingredient, and duplicating the store’s own text would only compete with it in search.',
          'A count of the ingredients is being checked against the formulation record. We do not publish a number, or any absolute promise about what the oil does not contain, until that check is complete and the owner has approved the exact wording — an unverified number is worse than no number.',
        ],
      },
      {
        id: 'how-to-use',
        heading: 'How to use it',
        body: [
          'Directions, cautions and the full ingredient list are printed on the pack and repeated on the official listing. Follow those, not a guide page: a label carries the version that was approved for the batch in your hand.',
          'If you are pregnant or breastfeeding, applying it to an infant, or you have a scalp condition or a known allergy, ask a qualified practitioner before use and read the cautions on the pack.',
        ],
      },
      {
        id: 'made-in-kerala',
        heading: 'Where it is made',
        body: [
          'Mariyas Naturals is a family business in Alappuzha district, Kerala — the address printed on the pack and published by the official store. The oil is a Kerala product in the ordinary sense: made here, sold from here, shipped from here.',
          'We publish manufacturing claims only at the level of the document that supports them. When the facility’s licences and reports have been checked, they will appear on the certifications page with their issuer, scope and dates.',
        ],
      },
    ],
    sizesHeading: 'Two pack sizes',
    sizesNote:
      'Both editions are the same oil. Purchases are completed on www.mariyasnaturals.com — this site never takes an order or a payment.',
    sizes: sizes({
      note200: 'The smaller pack, for trying the oil or for travel.',
      note500: 'The larger pack, for regular use at home.',
    }),
    evidenceHeading: 'What we publish, and what we hold back',
    evidenceBody:
      'Every claim on this site has a record behind it: what we would say, what evidence is required, and who has to approve it. A claim that has not cleared that gate is simply not written. That is why this page describes the oil without an ingredient count.',
    reviewsHeading: 'What customers say',
    reviewsNote:
      'These are customer opinions published exactly as they were written on Google Reviews. They are not tests, they are not proof of a result, and individual experiences differ.',
    faqHeading: 'Questions people ask',
    faq: [
      {
        q: 'Where can I buy the Mariyas Herbal Hair Care Oil?',
        a: 'On our official store, www.mariyasnaturals.com, in the 200 ml and 500 ml packs. This site is a guide and never takes an order.',
      },
      {
        q: 'How many ingredients are in it?',
        a: 'The formulation record is being verified against the pack, so we do not publish a count yet. The complete, current ingredient list is printed on the pack and published on the official product listing.',
      },
      {
        q: 'Will it stop hair fall or regrow hair?',
        a: 'We make no such claim. This is a cosmetic herbal oil, not a treatment, and a customer review is an opinion rather than clinical evidence. For hair loss, see a qualified practitioner.',
      },
      {
        q: 'Can I use it on a child?',
        a: 'The range includes separate baby-care oils. For an infant or a child, ask a qualified practitioner and read the cautions on the pack of the product you actually have.',
      },
      {
        q: 'Which size should I choose?',
        a: 'The 200 ml and 500 ml packs hold the same oil. Choose by how quickly you expect to finish it: the larger pack is for regular use at home, the smaller one for trying it or for travel.',
      },
    ],
    ctaHeading: 'Buy it on the official store',
    ctaBody:
      'The 200 ml and 500 ml packs, current prices and current availability live on www.mariyasnaturals.com.',
    ctaLabel: 'Open the official store',
    backToCollection: 'Back to the hair-care collection',
    productPage: 'See the catalogue entry',
  },

  ml: {
    title: 'ഹെയർ ഓയിൽ ഗൈഡ്: 200 ml, 500 ml',
    description:
      'മരിയാസ് ഹെർബൽ ഹെയർ കെയർ ഓയിൽ ഗൈഡ്: ലേബൽ പറയുന്നത്, 200 ml, 500 ml പായ്ക്കുകൾ, ഉപയോഗം, ഔദ്യോഗിക സ്റ്റോറിൽ വാങ്ങാനുള്ള വഴി.',
    eyebrow: 'ഹെയർ ഓയിൽ',
    heading: 'മരിയാസ് ഹെർബൽ ഹെയർ കെയർ ഓയിൽ',
    lede: 'ഒരേ ഫോർമുലേഷന്റെ രണ്ട് പായ്ക്കുകൾ, കേരളത്തിലെ ആലപ്പുഴയിൽ നിർമ്മിച്ച് ഞങ്ങളുടെ ഔദ്യോഗിക സ്റ്റോറിൽ വിൽക്കുന്നു. പായ്ക്കറ്റിൽ നിന്നും ലിസ്റ്റിംഗിൽ നിന്നും ഉറപ്പിച്ച് പറയാൻ കഴിയുന്നതെല്ലാം ഇവിടെ ഒരുമിച്ചിരിക്കുന്നു — രേഖ എവിടെ അവസാനിക്കുന്നു എന്നും വ്യക്തമാക്കുന്നു.',
    sections: [
      {
        id: 'what-it-is',
        heading: 'ഇത് എന്താണ്',
        body: [
          'മരിയാസ് ഹെർബൽ ഹെയർ കെയർ ഓയിൽ ദിവസേനയുള്ള തലയോട്ടിയുടെയും മുടിയുടെയും പരിചരണത്തിനുള്ള ഒരു ഹെയർ ഓയിൽ ആണ്; 200 ml, 500 ml പായ്ക്കുകളിൽ ലഭ്യമാണ്. രണ്ടിലും ഒരേ ഫോർമുലേഷൻ; വ്യത്യാസം അളവ് മാത്രം.',
          'ഇത് ഒരു കോസ്മെറ്റിക് ഹെർബൽ ഓയിൽ ആണ്. മരുന്നല്ല, തലയോട്ടിയിലെ രോഗത്തിനുള്ള ചികിത്സയല്ല, മുടിവളർച്ചയെക്കുറിച്ചുള്ള വാഗ്ദാനമായി ഈ പേജിലെ ഒന്നും വായിക്കരുത്.',
        ],
      },
      {
        id: 'formulation',
        heading: 'ഇതിൽ എന്തുണ്ട്',
        body: [
          'പൂർണ്ണമായ ചേരുവാ പട്ടിക പായ്ക്കറ്റിൽ അച്ചടിച്ചിരിക്കുന്നു, ഔദ്യോഗിക ലിസ്റ്റിംഗിൽ പ്രസിദ്ധീകരിച്ചിരിക്കുന്നു; അതാണ് അന്തിമ അവലംബം. ആ പട്ടിക ഇവിടെ പകർത്തുന്നില്ല: ഒരു ചെറിയ മാറ്റം പോലും ഒരു മുന്നറിയിപ്പ് വിട്ടുപോകാം, സ്റ്റോറിന്റെ വാചകം ആവർത്തിക്കുന്നത് തിരയലിൽ അതിനോട് മത്സരിക്കുക മാത്രമാകും.',
          'ചേരുവകളുടെ എണ്ണം ഫോർമുലേഷൻ രേഖയുമായി ഒത്തുനോക്കുന്നു. ആ പരിശോധന പൂർത്തിയായി, കൃത്യമായ പൊതു വാചകം ഉടമ അംഗീകരിച്ച ശേഷം മാത്രം ഞങ്ങൾ ഒരു സംഖ്യയോ "രാസവസ്തുക്കളില്ല" എന്ന വാചകമോ പ്രസിദ്ധീകരിക്കും; ഉറപ്പിക്കാത്ത സംഖ്യ സംഖ്യ ഇല്ലാത്തതിനെക്കാൾ മോശമാണ്.',
        ],
      },
      {
        id: 'how-to-use',
        heading: 'എങ്ങനെ ഉപയോഗിക്കാം',
        body: [
          'ഉപയോഗ നിർദ്ദേശങ്ങളും മുന്നറിയിപ്പുകളും ചേരുവാ പട്ടികയും പായ്ക്കറ്റിൽ അച്ചടിച്ചിരിക്കുന്നു, ഔദ്യോഗിക ലിസ്റ്റിംഗിലും ആവർത്തിച്ചിരിക്കുന്നു. അവ പിന്തുടരുക, ഒരു ഗൈഡ് പേജിനെയല്ല: നിങ്ങളുടെ കൈയിലുള്ള ബാച്ചിന് അംഗീകരിച്ച പതിപ്പ് ലേബലിലാണ്.',
          'ഗർഭിണിയോ മുലയൂട്ടുന്നവരോ ആണെങ്കിൽ, കുഞ്ഞിന് പുരട്ടുന്നുവെങ്കിൽ, തലയോട്ടി സംബന്ധമായ പ്രശ്നമോ അറിയപ്പെടുന്ന അലർജിയോ ഉണ്ടെങ്കിൽ, ഉപയോഗത്തിന് മുൻപ് യോഗ്യതയുള്ള ഒരു ഡോക്ടറെ സമീപിക്കുകയും പായ്ക്കറ്റിലെ മുന്നറിയിപ്പുകൾ വായിക്കുകയും ചെയ്യുക.',
        ],
      },
      {
        id: 'made-in-kerala',
        heading: 'എവിടെയാണ് നിർമ്മിക്കുന്നത്',
        body: [
          'മരിയാസ് നാച്വറൽസ് കേരളത്തിലെ ആലപ്പുഴ ജില്ലയിലെ ഒരു കുടുംബ സംരംഭമാണ് — പായ്ക്കറ്റിൽ അച്ചടിച്ച, ഔദ്യോഗിക സ്റ്റോർ പ്രസിദ്ധീകരിക്കുന്ന വിലാസം. ഇവിടെ നിർമ്മിച്ച്, ഇവിടെ നിന്ന് വിൽക്കുന്ന ഒരു കേരള ഉൽപ്പന്നം.',
          'നിർമ്മാണ സംബന്ധമായ വാദങ്ങൾ ആ രേഖ അനുവദിക്കുന്ന തലത്തിൽ മാത്രം ഞങ്ങൾ പ്രസിദ്ധീകരിക്കും. സ്ഥാപനത്തിന്റെ ലൈസൻസുകളും റിപ്പോർട്ടുകളും പരിശോധിച്ച ശേഷം അവ നൽകിയവർ, പരിധി, തീയതികൾ എന്നിവയോടെ സർട്ടിഫിക്കേഷൻ പേജിൽ വരും.',
        ],
      },
    ],
    sizesHeading: 'രണ്ട് പായ്ക്ക് വലിപ്പങ്ങൾ',
    sizesNote:
      'രണ്ട് പായ്ക്കുകളിലും ഒരേ ഓയിൽ. വാങ്ങൽ www.mariyasnaturals.com ൽ പൂർത്തിയാകും — ഈ സൈറ്റ് ഓർഡറോ പേയ്‌മെന്റോ സ്വീകരിക്കുന്നില്ല.',
    sizes: sizes({
      note200: 'ഓയിൽ പരീക്ഷിക്കാനോ യാത്രയ്‌ക്കോ ഉള്ള ചെറിയ പായ്ക്ക്.',
      note500: 'വീട്ടിൽ നിത്യേനയുള്ള ഉപയോഗത്തിനുള്ള വലിയ പായ്ക്ക്.',
    }),
    evidenceHeading: 'ഞങ്ങൾ പ്രസിദ്ധീകരിക്കുന്നതും പിൻവലിക്കുന്നതും',
    evidenceBody:
      'ഈ സൈറ്റിലെ ഓരോ വാദത്തിനും പിന്നിൽ ഒരു രേഖയുണ്ട്: ഞങ്ങൾ എന്ത് പറയും, എന്ത് തെളിവ് വേണം, ആര് അംഗീകരിക്കണം. ആ പരിശോധന കടന്നിട്ടില്ലാത്ത ഒരു വാദവും എഴുതില്ല. അതുകൊണ്ടാണ് ഈ പേജ് ചേരുവകളുടെ എണ്ണം പറയാതെ ഓയിലിനെ വിവരിക്കുന്നത്.',
    reviewsHeading: 'ഉപഭോക്താക്കൾ പറയുന്നത്',
    reviewsNote:
      'ഇവ ഗൂഗിൾ റിവ്യൂസിൽ എഴുതിയ അതേ രൂപത്തിൽ പ്രസിദ്ധീകരിച്ച ഉപഭോക്തൃ അഭിപ്രായങ്ങളാണ്. പരീക്ഷണമല്ല, ഫലത്തിന്റെ തെളിവല്ല, വ്യക്തിപരമായ അനുഭവങ്ങൾ വ്യത്യാസപ്പെടും.',
    faqHeading: 'പലരും ചോദിക്കുന്നത്',
    faq: [
      {
        q: 'മരിയാസ് ഹെർബൽ ഹെയർ കെയർ ഓയിൽ എവിടെ വാങ്ങാം?',
        a: 'ഞങ്ങളുടെ ഔദ്യോഗിക സ്റ്റോർ www.mariyasnaturals.com ൽ, 200 ml, 500 ml പായ്ക്കുകളിൽ. ഈ സൈറ്റ് ഒരു ഗൈഡ് മാത്രം; ഓർഡർ സ്വീകരിക്കുന്നില്ല.',
      },
      {
        q: 'ഇതിൽ എത്ര ചേരുവകളുണ്ട്?',
        a: 'ഫോർമുലേഷൻ രേഖ പായ്ക്കറ്റുമായി ഒത്തുനോക്കുന്നതിനാൽ ഞങ്ങൾ ഇപ്പോൾ ഒരു സംഖ്യ പ്രസിദ്ധീകരിക്കുന്നില്ല. പൂർണ്ണവും നിലവിലുള്ളതുമായ ചേരുവാ പട്ടിക പായ്ക്കറ്റിലും ഔദ്യോഗിക ലിസ്റ്റിംഗിലും ഉണ്ട്.',
      },
      {
        q: 'ഇത് മുടികൊഴിച്ചിൽ നിർത്തുമോ, മുടി വളർത്തുമോ?',
        a: 'അത്തരം ഒരു വാദവും ഞങ്ങൾ ഉന്നയിക്കുന്നില്ല. ഇത് ഒരു കോസ്മെറ്റിക് ഹെർബൽ ഓയിൽ ആണ്, ചികിത്സയല്ല; ഒരു ഉപഭോക്തൃ റിവ്യൂ ക്ലിനിക്കൽ തെളിവല്ല, ഒരു അഭിപ്രായമാണ്. മുടികൊഴിച്ചിലിന് യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കുക.',
      },
      {
        q: 'കുട്ടികൾക്ക് ഉപയോഗിക്കാമോ?',
        a: 'ഈ ശ്രേണിയിൽ പ്രത്യേക ബേബി കെയർ ഓയിലുകളുണ്ട്. കുഞ്ഞിനോ കുട്ടിക്കോ നൽകുന്നതിന് മുൻപ് യോഗ്യതയുള്ള ഡോക്ടറെ സമീപിക്കുകയും നിങ്ങളുടെ കൈയിലുള്ള ഉൽപ്പന്നത്തിന്റെ പായ്ക്കറ്റിലെ മുന്നറിയിപ്പുകൾ വായിക്കുകയും ചെയ്യുക.',
      },
      {
        q: 'ഏത് വലിപ്പം തിരഞ്ഞെടുക്കണം?',
        a: '200 ml, 500 ml പായ്ക്കുകളിൽ ഒരേ ഓയിൽ ആണ്. എത്ര വേഗം തീരും എന്നതനുസരിച്ച് തിരഞ്ഞെടുക്കുക: വീട്ടിലെ നിത്യേനയുള്ള ഉപയോഗത്തിന് വലിയ പായ്ക്ക്, പരീക്ഷിക്കാനോ യാത്രയ്‌ക്കോ ചെറിയത്.',
      },
    ],
    ctaHeading: 'ഔദ്യോഗിക സ്റ്റോറിൽ വാങ്ങുക',
    ctaBody:
      '200 ml, 500 ml പായ്ക്കുകൾ, നിലവിലെ വിലയും ലഭ്യതയും www.mariyasnaturals.com ൽ ആണ്.',
    ctaLabel: 'ഔദ്യോഗിക സ്റ്റോർ തുറക്കുക',
    backToCollection: 'ഹെയർ കെയർ ശേഖരത്തിലേക്ക് മടങ്ങുക',
    productPage: 'കാറ്റലോഗ് എൻട്രി കാണുക',
  },

  hi: {
    title: 'हेयर ऑयल गाइड: 200 ml और 500 ml',
    description:
      'मरियास हर्बल हेयर केयर ऑयल गाइड: लेबल क्या कहता है, 200 ml और 500 ml पैक, उपयोग, और www.mariyasnaturals.com पर खरीदने की जगह।',
    eyebrow: 'हेयर ऑयल',
    heading: 'मरियास हर्बल हेयर केयर ऑयल',
    lede: 'एक ही फ़ॉर्मुलेशन के दो पैक, केरल के अलप्पुझा में बने और हमारे आधिकारिक स्टोर पर बिकते हैं। यह पेज वह सब इकट्ठा करता है जो हम पैक और लिस्टिंग से कह सकते हैं — और साफ़ बताता है कि रिकॉर्ड कहाँ रुकता है।',
    sections: [
      {
        id: 'what-it-is',
        heading: 'यह क्या है',
        body: [
          'मरियास हर्बल हेयर केयर ऑयल रोज़ाना खोपड़ी और बालों की देखभाल के लिए एक हेयर ऑयल है, जो 200 ml और 500 ml पैक में आता है। दोनों में एक ही फ़ॉर्मुलेशन है; अंतर सिर्फ़ मात्रा का है।',
          'यह एक कॉस्मेटिक हर्बल तेल है। यह दवा नहीं है, खोपड़ी की किसी समस्या का इलाज नहीं है, और इस पेज की कोई बात बाल उगने का वादा नहीं है।',
        ],
      },
      {
        id: 'formulation',
        heading: 'इसमें क्या है',
        body: [
          'पूरी सामग्री सूची पैक पर छपी है और आधिकारिक उत्पाद लिस्टिंग पर प्रकाशित है — वही अंतिम प्रमाण है। हम उस सूची को यहाँ दोहराते नहीं: हल्का-सा बदलाव भी कोई चेतावनी छोड़ सकता है, और स्टोर के अपने पाठ को दोहराना सिर्फ़ खोज में उससे मुकाबला करेगा।',
          'सामग्रियों की संख्या फ़ॉर्मुलेशन रिकॉर्ड से मिलाई जा रही है। वह जाँच पूरी होने और मालिक द्वारा सटीक सार्वजनिक शब्दावली स्वीकृत होने तक हम कोई संख्या या "रसायन-मुक्त" जैसा शब्द प्रकाशित नहीं करेंगे, क्योंकि बिना पुष्टि की संख्या संख्या न होने से भी बुरी है।',
        ],
      },
      {
        id: 'how-to-use',
        heading: 'इसका उपयोग कैसे करें',
        body: [
          'उपयोग के निर्देश, चेतावनियाँ और पूरी सामग्री सूची पैक पर छपी हैं और आधिकारिक लिस्टिंग पर दोहराई गई हैं। उन्हें मानें, किसी गाइड पेज को नहीं: आपके हाथ के बैच के लिए स्वीकृत संस्करण लेबल पर है।',
          'यदि आप गर्भवती या स्तनपान करा रही हैं, शिशु पर लगा रही हैं, या खोपड़ी की कोई समस्या या ज्ञात एलर्जी है, तो उपयोग से पहले योग्य चिकित्सक से पूछें और पैक की चेतावनियाँ पढ़ें।',
        ],
      },
      {
        id: 'made-in-kerala',
        heading: 'यह कहाँ बनता है',
        body: [
          'मरियास नैचुरल्स केरल के अलप्पुझा ज़िले का एक पारिवारिक व्यवसाय है — वही पता जो पैक पर छपा है और आधिकारिक स्टोर प्रकाशित करता है। यह सामान्य अर्थ में केरल का उत्पाद है: यहाँ बना, यहाँ से बिका, यहाँ से भेजा गया।',
          'निर्माण संबंधी दावे हम केवल उस दस्तावेज़ के स्तर तक प्रकाशित करते हैं जो उन्हें सहारा देता है। सुविधा के लाइसेंस और रिपोर्ट जाँचे जाने के बाद वे जारीकर्ता, दायरे और तिथियों के साथ प्रमाणन पेज पर आएँगे।',
        ],
      },
    ],
    sizesHeading: 'दो पैक आकार',
    sizesNote:
      'दोनों संस्करणों में एक ही तेल है। खरीदारी www.mariyasnaturals.com पर पूरी होती है — यह साइट कोई ऑर्डर या भुगतान नहीं लेती।',
    sizes: sizes({
      note200: 'छोटा पैक — तेल आज़माने या यात्रा के लिए।',
      note500: 'बड़ा पैक — घर पर नियमित उपयोग के लिए।',
    }),
    evidenceHeading: 'हम क्या प्रकाशित करते हैं और क्या रोकते हैं',
    evidenceBody:
      'इस साइट के हर दावे के पीछे एक रिकॉर्ड है: हम क्या कहेंगे, कौन-सा प्रमाण चाहिए, और किसे स्वीकृति देनी है। जो दावा यह कसौटी पार नहीं करता, वह लिखा ही नहीं जाता। इसीलिए यह पेज सामग्रियों की संख्या बताए बिना तेल का वर्णन करता है।',
    reviewsHeading: 'ग्राहक क्या कहते हैं',
    reviewsNote:
      'ये ग्राहकों की राय हैं, ठीक वैसे ही प्रकाशित जैसे गूगल रिव्यूज़ पर लिखी गई थीं। ये परीक्षण नहीं हैं, किसी परिणाम का प्रमाण नहीं हैं, और अनुभव व्यक्तिगत होते हैं।',
    faqHeading: 'लोग जो पूछते हैं',
    faq: [
      {
        q: 'मरियास हर्बल हेयर केयर ऑयल कहाँ खरीदें?',
        a: 'हमारे आधिकारिक स्टोर www.mariyasnaturals.com पर, 200 ml और 500 ml पैक में। यह साइट केवल गाइड है, कोई ऑर्डर नहीं लेती।',
      },
      {
        q: 'इसमें कितनी सामग्रियाँ हैं?',
        a: 'फ़ॉर्मुलेशन रिकॉर्ड पैक से मिलाया जा रहा है, इसलिए अभी हम कोई संख्या प्रकाशित नहीं करते। पूरी और वर्तमान सामग्री सूची पैक पर और आधिकारिक लिस्टिंग पर है।',
      },
      {
        q: 'क्या यह बाल झड़ना रोकेगा या बाल उगाएगा?',
        a: 'हम ऐसा कोई दावा नहीं करते। यह कॉस्मेटिक हर्बल तेल है, इलाज नहीं; ग्राहक की समीक्षा राय है, नैदानिक प्रमाण नहीं। बाल झड़ने के लिए योग्य चिकित्सक से मिलें।',
      },
      {
        q: 'क्या इसे बच्चे पर लगा सकते हैं?',
        a: 'श्रृंखला में अलग बेबी केयर तेल हैं। शिशु या बच्चे के लिए योग्य चिकित्सक से पूछें और जो उत्पाद आपके पास है उसके पैक की चेतावनियाँ पढ़ें।',
      },
      {
        q: 'कौन-सा आकार चुनूँ?',
        a: '200 ml और 500 ml पैक में एक ही तेल है। यह देखकर चुनें कि कितनी जल्दी खत्म होगा: घर पर नियमित उपयोग के लिए बड़ा पैक, आज़माने या यात्रा के लिए छोटा।',
      },
    ],
    ctaHeading: 'आधिकारिक स्टोर पर खरीदें',
    ctaBody:
      '200 ml और 500 ml पैक, मौजूदा कीमतें और उपलब्धता www.mariyasnaturals.com पर हैं।',
    ctaLabel: 'आधिकारिक स्टोर खोलें',
    backToCollection: 'हेयर केयर संग्रह पर वापस',
    productPage: 'कैटलॉग प्रविष्टि देखें',
  },

  ta: {
    title: 'ஹேர் ஆயில் வழிகாட்டி: 200 ml, 500 ml',
    description:
      'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயில் வழிகாட்டி: லேபிள் என்ன சொல்கிறது, 200 ml, 500 ml பேக்குகள், பயன்பாடு, அதிகாரப்பூர்வ ஸ்டோரில் வாங்கும் இடம்.',
    eyebrow: 'ஹேர் ஆயில்',
    heading: 'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயில்',
    lede: 'ஒரே ஃபார்முலேஷனின் இரண்டு பேக்குகள், கேரளாவின் ஆலப்புழாவில் தயாரிக்கப்பட்டு எங்கள் அதிகாரப்பூர்வ ஸ்டோரில் விற்கப்படுகிறது. பேக்கிலும் பட்டியலிலும் இருந்து நாங்கள் சொல்லக்கூடிய அனைத்தையும் இந்தப் பக்கம் தொகுக்கிறது — பதிவு எங்கே நிற்கிறது என்பதையும் தெளிவாகச் சொல்கிறது.',
    sections: [
      {
        id: 'what-it-is',
        heading: 'இது என்ன',
        body: [
          'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயில் தினசரி தலைக்கு மற்றும் முடிக்கான பராமரிப்புக்கான ஹேர் ஆயில்; 200 ml மற்றும் 500 ml பேக்குகளில் கிடைக்கிறது. இரண்டிலும் ஒரே ஃபார்முலேஷன்; வேறுபாடு அளவு மட்டுமே.',
          'இது ஒரு காஸ்மெடிக் ஹெர்பல் எண்ணெய். மருந்து அல்ல, தலைக்கு நோய்க்கான சிகிச்சை அல்ல; முடி வளர்ச்சி பற்றிய உறுதிமொழியாக இந்தப் பக்கத்தில் எதையும் படிக்க வேண்டாம்.',
        ],
      },
      {
        id: 'formulation',
        heading: 'இதில் என்ன இருக்கிறது',
        body: [
          'முழு மூலப்பொருள் பட்டியல் பேக்கில் அச்சிடப்பட்டு, அதிகாரப்பூர்வ தயாரிப்பு பட்டியலில் வெளியிடப்பட்டுள்ளது — அதுவே இறுதி ஆதாரம். அந்தப் பட்டியலை இங்கே மீண்டும் எழுதுவதில்லை: சிறு மாற்றமும் ஒரு எச்சரிக்கையை விட்டுவிடலாம், ஸ்டோரின் சொந்த உரையைத் திரும்பச் சொல்வது தேடலில் அதனுடன் போட்டியிடுவதே.',
          'மூலப்பொருட்களின் எண்ணிக்கை ஃபார்முலேஷன் பதிவுடன் ஒப்பிடப்படுகிறது. அந்தச் சரிபார்ப்பு முடிந்து, உரிமையாளர் சரியான பொது வாசகத்தை அனுமதித்த பிறகே எண்ணிக்கையையோ "இரசாயனமற்றது" என்பதையோ வெளியிடுவோம்; உறுதிப்படுத்தாத எண் எண் இல்லாததை விட மோசம்.',
        ],
      },
      {
        id: 'how-to-use',
        heading: 'எப்படிப் பயன்படுத்துவது',
        body: [
          'பயன்பாட்டு வழிமுறைகள், எச்சரிக்கைகள், முழு மூலப்பொருள் பட்டியல் ஆகியவை பேக்கில் அச்சிடப்பட்டு அதிகாரப்பூர்வ பட்டியலிலும் திரும்பக் கூறப்பட்டுள்ளன. அவற்றைப் பின்பற்றுங்கள், ஒரு வழிகாட்டி பக்கத்தை அல்ல: உங்கள் கையில் உள்ள பேட்சுக்கு அனுமதிக்கப்பட்ட பதிப்பு லேபிளில் உள்ளது.',
          'கர்ப்பமாகவோ பாலூட்டுகிறவராகவோ இருந்தால், குழந்தைக்குப் பூசினால், தலைக்கு பிரச்சினையோ தெரிந்த ஒவ்வாமையோ இருந்தால், பயன்பாட்டுக்கு முன் தகுதியான மருத்துவரை அணுகி பேக்கின் எச்சரிக்கைகளைப் படியுங்கள்.',
        ],
      },
      {
        id: 'made-in-kerala',
        heading: 'எங்கே தயாரிக்கப்படுகிறது',
        body: [
          'மரியாஸ் நேச்சுரல்ஸ் கேரளாவின் ஆலப்புழா மாவட்டத்தில் உள்ள குடும்ப நிறுவனம் — பேக்கில் அச்சிடப்பட்ட, அதிகாரப்பூர்வ ஸ்டோர் வெளியிடும் முகவரி. இது சாதாரண அர்த்தத்தில் கேரளத் தயாரிப்பு: இங்கே தயாரிக்கப்பட்டு, இங்கிருந்து விற்கப்பட்டு, இங்கிருந்து அனுப்பப்படுகிறது.',
          'தயாரிப்பு தொடர்பான கூற்றுகளை அதற்கு ஆதாரமான ஆவணத்தின் அளவில் மட்டுமே வெளியிடுவோம். நிறுவனத்தின் உரிமங்களும் அறிக்கைகளும் சரிபார்க்கப்பட்ட பிறகு, வழங்கியவர், எல்லை, தேதிகளுடன் சான்றிதழ் பக்கத்தில் வரும்.',
        ],
      },
    ],
    sizesHeading: 'இரண்டு பேக் அளவுகள்',
    sizesNote:
      'இரண்டு பதிப்புகளிலும் ஒரே எண்ணெய். வாங்குதல் www.mariyasnaturals.com இல் முடிகிறது — இந்தத் தளம் ஆர்டரையோ பணத்தையோ பெறாது.',
    sizes: sizes({
      note200: 'சிறிய பேக் — எண்ணெயை முயற்சிக்க அல்லது பயணத்திற்கு.',
      note500: 'பெரிய பேக் — வீட்டில் வழக்கமான பயன்பாட்டிற்கு.',
    }),
    evidenceHeading: 'நாங்கள் வெளியிடுவதும் நிறுத்துவதும்',
    evidenceBody:
      'இந்தத் தளத்தின் ஒவ்வொரு கூற்றுக்குப் பின்னும் ஒரு பதிவு உள்ளது: நாங்கள் என்ன சொல்வோம், என்ன ஆதாரம் தேவை, யார் அனுமதிக்க வேண்டும். அந்தச் சரிபார்ப்பைக் கடக்காத கூற்று எழுதப்படுவதே இல்லை. அதனால்தான் இந்தப் பக்கம் மூலப்பொருள் எண்ணிக்கையைச் சொல்லாமல் எண்ணெயை விவரிக்கிறது.',
    reviewsHeading: 'வாடிக்கையாளர்கள் சொல்வது',
    reviewsNote:
      'இவை கூகுள் ரிவியூவில் எழுதப்பட்ட அதே வடிவில் வெளியிடப்பட்ட வாடிக்கையாளர் கருத்துகள். இவை சோதனைகள் அல்ல, முடிவுக்கான ஆதாரம் அல்ல; அனுபவங்கள் தனிப்பட்டவை.',
    faqHeading: 'மக்கள் கேட்பவை',
    faq: [
      {
        q: 'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயிலை எங்கு வாங்கலாம்?',
        a: 'எங்கள் அதிகாரப்பூர்வ ஸ்டோர் www.mariyasnaturals.com இல், 200 ml மற்றும் 500 ml பேக்குகளில். இந்தத் தளம் ஒரு வழிகாட்டி மட்டுமே; ஆர்டர் எடுக்காது.',
      },
      {
        q: 'இதில் எத்தனை மூலப்பொருட்கள் உள்ளன?',
        a: 'ஃபார்முலேஷன் பதிவு பேக்குடன் ஒப்பிடப்படுவதால் இப்போது எண்ணிக்கையை வெளியிடவில்லை. முழுமையான, தற்போதைய மூலப்பொருள் பட்டியல் பேக்கிலும் அதிகாரப்பூர்வ பட்டியலிலும் உள்ளது.',
      },
      {
        q: 'இது முடி உதிர்வை நிறுத்துமா, முடி வளர்த்துமா?',
        a: 'அப்படி ஒரு கூற்றை நாங்கள் முன்வைக்கவில்லை. இது ஒரு காஸ்மெடிக் ஹெர்பல் எண்ணெய், சிகிச்சை அல்ல; வாடிக்கையாளர் விமர்சனம் ஒரு கருத்து, மருத்துவ ஆதாரம் அல்ல. முடி உதிர்வுக்கு தகுதியான மருத்துவரை அணுகுங்கள்.',
      },
      {
        q: 'குழந்தைக்குப் பயன்படுத்தலாமா?',
        a: 'இந்தத் தொகுப்பில் தனி பேபி கேர் எண்ணெய்கள் உள்ளன. குழந்தைக்கு அல்லது சிறுவருக்கு தகுதியான மருத்துவரைக் கேட்டு, உங்களிடம் உள்ள தயாரிப்பின் பேக்கில் உள்ள எச்சரிக்கைகளைப் படியுங்கள்.',
      },
      {
        q: 'எந்த அளவைத் தேர்ந்தெடுக்க வேண்டும்?',
        a: '200 ml, 500 ml பேக்குகளில் ஒரே எண்ணெய். எவ்வளவு விரைவில் தீரும் என்பதைப் பொறுத்து தேர்ந்தெடுங்கள்: வீட்டில் வழக்கமான பயன்பாட்டிற்கு பெரியது, முயற்சிக்க அல்லது பயணத்திற்கு சிறியது.',
      },
    ],
    ctaHeading: 'அதிகாரப்பூர்வ ஸ்டோரில் வாங்குங்கள்',
    ctaBody:
      '200 ml, 500 ml பேக்குகள், தற்போதைய விலை மற்றும் இருப்பு www.mariyasnaturals.com இல் உள்ளது.',
    ctaLabel: 'அதிகாரப்பூர்வ ஸ்டோரைத் திறக்கவும்',
    backToCollection: 'ஹேர் கேர் தொகுப்புக்குத் திரும்பு',
    productPage: 'கேட்டலாக் பதிவைப் பார்க்கவும்',
  },

  kn: {
    title: 'ಹೇರ್ ಆಯಿಲ್ ಮಾರ್ಗದರ್ಶಿ: 200 ml, 500 ml',
    description:
      'ಮರಿಯಾಸ್ ಹರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್ ಮಾರ್ಗದರ್ಶಿ: ಲೇಬಲ್ ಏನು ಹೇಳುತ್ತದೆ, 200 ml, 500 ml ಪ್ಯಾಕ್, ಬಳಕೆ, ಅಧಿಕೃತ ಸ್ಟೋರ್‌ನಲ್ಲಿ ಖರೀದಿಸುವ ಸ್ಥಳ.',
    eyebrow: 'ಹೇರ್ ಆಯಿಲ್',
    heading: 'ಮರಿಯಾಸ್ ಹರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್',
    lede: 'ಒಂದೇ ಸೂತ್ರೀಕರಣದ ಎರಡು ಪ್ಯಾಕ್‌ಗಳು, ಕೇರಳದ ಅಲಪ್ಪುಳದಲ್ಲಿ ತಯಾರಾಗಿ ನಮ್ಮ ಅಧಿಕೃತ ಸ್ಟೋರ್‌ನಲ್ಲಿ ಮಾರಾಟವಾಗುತ್ತವೆ. ಪ್ಯಾಕ್ ಮತ್ತು ಪಟ್ಟಿಯಿಂದ ನಾವು ಹೇಳಬಹುದಾದ ಎಲ್ಲವನ್ನೂ ಈ ಪುಟ ಸಂಗ್ರಹಿಸುತ್ತದೆ — ದಾಖಲೆ ಎಲ್ಲಿ ನಿಲ್ಲುತ್ತದೆ ಎಂಬುದನ್ನೂ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳುತ್ತದೆ.',
    sections: [
      {
        id: 'what-it-is',
        heading: 'ಇದು ಏನು',
        body: [
          'ಮರಿಯಾಸ್ ಹರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್ ದಿನನಿತ್ಯದ ನೆತ್ತಿ ಮತ್ತು ಕೂದಲ ಆರೈಕೆಗಾಗಿ ಒಂದು ಹೇರ್ ಆಯಿಲ್; 200 ml ಮತ್ತು 500 ml ಪ್ಯಾಕ್‌ಗಳಲ್ಲಿ ಸಿಗುತ್ತದೆ. ಎರಡರಲ್ಲೂ ಒಂದೇ ಸೂತ್ರೀಕರಣ; ವ್ಯತ್ಯಾಸ ಪ್ರಮಾಣದಷ್ಟೇ.',
          'ಇದು ಒಂದು ಕಾಸ್ಮೆಟಿಕ್ ಹರ್ಬಲ್ ಎಣ್ಣೆ. ಔಷಧವಲ್ಲ, ನೆತ್ತಿಯ ಸಮಸ್ಯೆಗೆ ಚಿಕಿತ್ಸೆಯಲ್ಲ, ಮತ್ತು ಈ ಪುಟದ ಯಾವುದೂ ಕೂದಲು ಬೆಳೆಯುವ ಭರವಸೆಯಲ್ಲ.',
        ],
      },
      {
        id: 'formulation',
        heading: 'ಇದರಲ್ಲಿ ಏನಿದೆ',
        body: [
          'ಪೂರ್ಣ ಪದಾರ್ಥ ಪಟ್ಟಿ ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಮುದ್ರಿತವಾಗಿದ್ದು ಅಧಿಕೃತ ಉತ್ಪನ್ನ ಪಟ್ಟಿಯಲ್ಲಿ ಪ್ರಕಟವಾಗಿದೆ — ಅದೇ ಅಂತಿಮ ಆಧಾರ. ಆ ಪಟ್ಟಿಯನ್ನು ಇಲ್ಲಿ ಪುನಃ ಬರೆಯುವುದಿಲ್ಲ: ಸಣ್ಣ ಬದಲಾವಣೆಯೂ ಒಂದು ಎಚ್ಚರಿಕೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಬಹುದು, ಮತ್ತು ಸ್ಟೋರ್‌ನ ಸ್ವಂತ ಪಠ್ಯವನ್ನು ಪುನರಾವರ್ತಿಸುವುದು ಹುಡುಕಾಟದಲ್ಲಿ ಅದರೊಂದಿಗೆ ಸ್ಪರ್ಧಿಸುವುದಷ್ಟೇ.',
          'ಪದಾರ್ಥಗಳ ಸಂಖ್ಯೆಯನ್ನು ಸೂತ್ರೀಕರಣ ದಾಖಲೆಯೊಂದಿಗೆ ಹೋಲಿಸಲಾಗುತ್ತಿದೆ. ಆ ಪರಿಶೀಲನೆ ಮುಗಿದು, ಮಾಲೀಕರು ನಿಖರವಾದ ಸಾರ್ವಜನಿಕ ಪದಗಳನ್ನು ಅನುಮೋದಿಸಿದ ನಂತರವೇ ನಾವು ಸಂಖ್ಯೆಯನ್ನೋ "ರಾಸಾಯನಿಕ ಮುಕ್ತ" ಎಂಬುದನ್ನೋ ಪ್ರಕಟಿಸುತ್ತೇವೆ; ದೃಢೀಕರಿಸದ ಸಂಖ್ಯೆ ಸಂಖ್ಯೆ ಇಲ್ಲದಿರುವುದಕ್ಕಿಂತ ಕೆಟ್ಟದು.',
        ],
      },
      {
        id: 'how-to-use',
        heading: 'ಹೇಗೆ ಬಳಸುವುದು',
        body: [
          'ಬಳಕೆಯ ಸೂಚನೆಗಳು, ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಪೂರ್ಣ ಪದಾರ್ಥ ಪಟ್ಟಿ ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಮುದ್ರಿತವಾಗಿವೆ ಮತ್ತು ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಪುನರಾವರ್ತಿತವಾಗಿವೆ. ಅವನ್ನು ಅನುಸರಿಸಿ, ಮಾರ್ಗದರ್ಶಿ ಪುಟವನ್ನಲ್ಲ: ನಿಮ್ಮ ಕೈಯಲ್ಲಿರುವ ಬ್ಯಾಚ್‌ಗೆ ಅನುಮೋದಿತ ಆವೃತ್ತಿ ಲೇಬಲ್‌ನಲ್ಲಿದೆ.',
          'ಗರ್ಭಿಣಿಯಾಗಿದ್ದರೆ ಅಥವಾ ಹಾಲುಣಿಸುತ್ತಿದ್ದರೆ, ಶಿಶುವಿಗೆ ಹಚ್ಚುತ್ತಿದ್ದರೆ, ಅಥವಾ ನೆತ್ತಿಯ ಸಮಸ್ಯೆ ಅಥವಾ ತಿಳಿದಿರುವ ಅಲರ್ಜಿ ಇದ್ದರೆ, ಬಳಕೆಗೆ ಮೊದಲು ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ಪ್ಯಾಕ್‌ನ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಓದಿ.',
        ],
      },
      {
        id: 'made-in-kerala',
        heading: 'ಎಲ್ಲಿ ತಯಾರಾಗುತ್ತದೆ',
        body: [
          'ಮರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಕೇರಳದ ಅಲಪ್ಪುಳ ಜಿಲ್ಲೆಯ ಕುಟುಂಬ ಉದ್ಯಮ — ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಮುದ್ರಿತವಾದ, ಅಧಿಕೃತ ಸ್ಟೋರ್ ಪ್ರಕಟಿಸುವ ವಿಳಾಸ. ಇದು ಸಾಮಾನ್ಯ ಅರ್ಥದಲ್ಲಿ ಕೇರಳದ ಉತ್ಪನ್ನ: ಇಲ್ಲಿ ತಯಾರಾಗಿ, ಇಲ್ಲಿಂದ ಮಾರಾಟವಾಗಿ, ಇಲ್ಲಿಂದ ರವಾನೆಯಾಗುತ್ತದೆ.',
          'ತಯಾರಿಕೆಗೆ ಸಂಬಂಧಿಸಿದ ಹೇಳಿಕೆಗಳನ್ನು ಅವನ್ನು ಆಧರಿಸುವ ದಾಖಲೆಯ ಮಟ್ಟದಲ್ಲಿ ಮಾತ್ರ ಪ್ರಕಟಿಸುತ್ತೇವೆ. ಸ್ಥಾವರದ ಪರವಾನಗಿಗಳು ಮತ್ತು ವರದಿಗಳು ಪರಿಶೀಲನೆಯಾದ ನಂತರ ಅವು ನೀಡಿದವರು, ವ್ಯಾಪ್ತಿ ಮತ್ತು ದಿನಾಂಕಗಳೊಂದಿಗೆ ಪ್ರಮಾಣೀಕರಣ ಪುಟದಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.',
        ],
      },
    ],
    sizesHeading: 'ಎರಡು ಪ್ಯಾಕ್ ಗಾತ್ರಗಳು',
    sizesNote:
      'ಎರಡೂ ಆವೃತ್ತಿಗಳಲ್ಲಿ ಒಂದೇ ಎಣ್ಣೆ. ಖರೀದಿ www.mariyasnaturals.com ನಲ್ಲಿ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ — ಈ ತಾಣ ಆರ್ಡರ್ ಅಥವಾ ಪಾವತಿ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ.',
    sizes: sizes({
      note200: 'ಚಿಕ್ಕ ಪ್ಯಾಕ್ — ಎಣ್ಣೆಯನ್ನು ಪ್ರಯತ್ನಿಸಲು ಅಥವಾ ಪ್ರಯಾಣಕ್ಕೆ.',
      note500: 'ದೊಡ್ಡ ಪ್ಯಾಕ್ — ಮನೆಯಲ್ಲಿ ನಿಯಮಿತ ಬಳಕೆಗೆ.',
    }),
    evidenceHeading: 'ನಾವು ಪ್ರಕಟಿಸುವುದು ಮತ್ತು ತಡೆಹಿಡಿಯುವುದು',
    evidenceBody:
      'ಈ ತಾಣದ ಪ್ರತಿ ಹೇಳಿಕೆಯ ಹಿಂದೆ ಒಂದು ದಾಖಲೆ ಇದೆ: ನಾವು ಏನು ಹೇಳುತ್ತೇವೆ, ಯಾವ ಸಾಕ್ಷ್ಯ ಬೇಕು, ಯಾರು ಅನುಮೋದಿಸಬೇಕು. ಆ ಪರಿಶೀಲನೆಯನ್ನು ದಾಟದ ಹೇಳಿಕೆ ಬರೆಯುವುದೇ ಇಲ್ಲ. ಅದಕ್ಕಾಗಿಯೇ ಈ ಪುಟ ಪದಾರ್ಥಗಳ ಸಂಖ್ಯೆ ಹೇಳದೆ ಎಣ್ಣೆಯನ್ನು ವಿವರಿಸುತ್ತದೆ.',
    reviewsHeading: 'ಗ್ರಾಹಕರು ಏನು ಹೇಳುತ್ತಾರೆ',
    reviewsNote:
      'ಇವು ಗೂಗಲ್ ರಿವ್ಯೂನಲ್ಲಿ ಬರೆದ ಅದೇ ರೂಪದಲ್ಲಿ ಪ್ರಕಟವಾದ ಗ್ರಾಹಕ ಅಭಿಪ್ರಾಯಗಳು. ಇವು ಪರೀಕ್ಷೆಗಳಲ್ಲ, ಫಲಿತಾಂಶದ ಸಾಕ್ಷ್ಯವಲ್ಲ; ಅನುಭವಗಳು ವೈಯಕ್ತಿಕ.',
    faqHeading: 'ಜನರು ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು',
    faq: [
      {
        q: 'ಮರಿಯಾಸ್ ಹರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್ ಎಲ್ಲಿ ಖರೀದಿಸಬಹುದು?',
        a: 'ನಮ್ಮ ಅಧಿಕೃತ ಸ್ಟೋರ್ www.mariyasnaturals.com ನಲ್ಲಿ, 200 ml ಮತ್ತು 500 ml ಪ್ಯಾಕ್‌ಗಳಲ್ಲಿ. ಈ ತಾಣ ಕೇವಲ ಮಾರ್ಗದರ್ಶಿ; ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ.',
      },
      {
        q: 'ಇದರಲ್ಲಿ ಎಷ್ಟು ಪದಾರ್ಥಗಳಿವೆ?',
        a: 'ಸೂತ್ರೀಕರಣ ದಾಖಲೆಯನ್ನು ಪ್ಯಾಕ್‌ನೊಂದಿಗೆ ಹೋಲಿಸುತ್ತಿರುವುದರಿಂದ ಸದ್ಯಕ್ಕೆ ಸಂಖ್ಯೆ ಪ್ರಕಟಿಸುವುದಿಲ್ಲ. ಪೂರ್ಣ ಮತ್ತು ಪ್ರಸ್ತುತ ಪದಾರ್ಥ ಪಟ್ಟಿ ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಮತ್ತು ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಇದೆ.',
      },
      {
        q: 'ಇದು ಕೂದಲು ಉದುರುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆಯೇ ಅಥವಾ ಬೆಳೆಸುತ್ತದೆಯೇ?',
        a: 'ಅಂತಹ ಹೇಳಿಕೆಯನ್ನು ನಾವು ನೀಡುವುದಿಲ್ಲ. ಇದು ಕಾಸ್ಮೆಟಿಕ್ ಹರ್ಬಲ್ ಎಣ್ಣೆ, ಚಿಕಿತ್ಸೆಯಲ್ಲ; ಗ್ರಾಹಕರ ವಿಮರ್ಶೆ ಅಭಿಪ್ರಾಯ, ವೈದ್ಯಕೀಯ ಸಾಕ್ಷ್ಯವಲ್ಲ. ಕೂದಲು ಉದುರುವಿಕೆಗೆ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      },
      {
        q: 'ಮಗುವಿಗೆ ಬಳಸಬಹುದೇ?',
        a: 'ಈ ಶ್ರೇಣಿಯಲ್ಲಿ ಪ್ರತ್ಯೇಕ ಬೇಬಿ ಕೇರ್ ಎಣ್ಣೆಗಳಿವೆ. ಶಿಶು ಅಥವಾ ಮಗುವಿಗೆ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಕೇಳಿ ಮತ್ತು ನಿಮ್ಮ ಬಳಿ ಇರುವ ಉತ್ಪನ್ನದ ಪ್ಯಾಕ್‌ನ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಓದಿ.',
      },
      {
        q: 'ಯಾವ ಗಾತ್ರ ಆಯ್ಕೆ ಮಾಡಬೇಕು?',
        a: '200 ml ಮತ್ತು 500 ml ಪ್ಯಾಕ್‌ಗಳಲ್ಲಿ ಒಂದೇ ಎಣ್ಣೆ. ಎಷ್ಟು ಬೇಗ ಮುಗಿಯುತ್ತದೆ ಎಂಬುದನ್ನು ನೋಡಿ ಆಯ್ಕೆ ಮಾಡಿ: ಮನೆಯಲ್ಲಿ ನಿಯಮಿತ ಬಳಕೆಗೆ ದೊಡ್ಡದು, ಪ್ರಯತ್ನಿಸಲು ಅಥವಾ ಪ್ರಯಾಣಕ್ಕೆ ಚಿಕ್ಕದು.',
      },
    ],
    ctaHeading: 'ಅಧಿಕೃತ ಸ್ಟೋರ್‌ನಲ್ಲಿ ಖರೀದಿಸಿ',
    ctaBody:
      '200 ml, 500 ml ಪ್ಯಾಕ್‌ಗಳು, ಪ್ರಸ್ತುತ ಬೆಲೆ ಮತ್ತು ಲಭ್ಯತೆ www.mariyasnaturals.com ನಲ್ಲಿದೆ.',
    ctaLabel: 'ಅಧಿಕೃತ ಸ್ಟೋರ್ ತೆರೆಯಿರಿ',
    backToCollection: 'ಹೇರ್ ಕೇರ್ ಸಂಗ್ರಹಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    productPage: 'ಕ್ಯಾಟಲಾಗ್ ನಮೂದು ನೋಡಿ',
  },
};
