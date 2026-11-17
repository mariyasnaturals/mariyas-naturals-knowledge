/**
 * Awards and certifications — evidence-gated registries.
 *
 * Both arrays are empty on purpose. An entry is added only when the owner has
 * supplied the underlying document and approved the exact public wording; the
 * routes then leave `noindex` and enter the sitemap (see
 * `evidence-publication.json`). Until then the pages exist as reviewed templates
 * that explain the verification and carry no claim at all.
 *
 * What is deliberately absent: award titles, issuing organisations, years,
 * certificate numbers, dates, laboratory results and photographs. None of those
 * exist in this repository and none may be typed in from imagination.
 */
import type { Locale } from '../i18n';
import publication from './evidence-publication.json';

export type Localized = Readonly<Record<Locale, string>>;

/** The four document kinds the certifications page has to keep apart. */
export type CertificateKind =
  | 'manufacturing-licence'
  | 'laboratory-report'
  | 'quality-certification'
  | 'government-document';

export interface AwardEntry {
  id: string;
  title: Localized;
  /** The body that gave the award, exactly as it prints its own name. */
  issuer: string;
  year: number;
  description: Localized;
  /** Local, owner-supplied photograph or certificate scan. */
  evidence: {
    kind: 'photograph' | 'certificate';
    src: string;
    alt: Localized;
    suppliedOn: string;
  };
  verifiedOn: string;
}

export interface CertificationEntry {
  id: string;
  /** Certificate name as it appears on the document. */
  name: Localized;
  issuer: string;
  kind: CertificateKind;
  /** What the document actually covers — never wider than the paper. */
  scope: Localized;
  issuedOn: string;
  /** Absent when the document does not expire. */
  expiresOn?: string;
  /** Scan or PDF supplied by the owner, stored locally. */
  document: { src: string; format: 'image' | 'pdf'; suppliedOn: string };
  /** Free text describing what was masked before publication. */
  redactions: string;
  /** Product ids this certificate may be linked from, once published. */
  relatedStoreProductIds: readonly number[];
  verifiedOn: string;
}

export const awards: readonly AwardEntry[] = Object.freeze([]);
export const certifications: readonly CertificationEntry[] = Object.freeze([]);

export const awardsPublished = publication.awards === true;
export const certificationsPublished = publication.certifications === true;

/** A route is publishable only when it holds at least one verified entry. */
export const awardsPublishable = awardsPublished && awards.length > 0;
export const certificationsPublishable =
  certificationsPublished && certifications.length > 0;

export interface EvidenceCopy {
  awards: {
    title: string;
    description: string;
    eyebrow: string;
    heading: string;
    lede: string;
    pendingHeading: string;
    pendingBody: string;
    checklistHeading: string;
    checklist: readonly string[];
    rulesHeading: string;
    rules: readonly string[];
    back: string;
  };
  certifications: {
    title: string;
    description: string;
    eyebrow: string;
    heading: string;
    lede: string;
    pendingHeading: string;
    pendingBody: string;
    checklistHeading: string;
    checklist: readonly string[];
    kindsHeading: string;
    kinds: readonly { kind: CertificateKind; label: string; note: string }[];
    licenceClarification: string;
    redactionNote: string;
    back: string;
  };
  /** Footer/nav labels. */
  nav: { awards: string; certifications: string; guide: string };
}

export const evidenceCopy: Readonly<Record<Locale, EvidenceCopy>> = {
  en: {
    awards: {
      title: 'Awards and recognitions',
      description:
        'Recognition the Mariyas Naturals family has actually received, published only with the award title, issuing organisation, year and supporting document.',
      eyebrow: 'Recognition',
      heading: 'Awards and recognitions',
      lede: 'A record of recognition the family has received, kept to the same standard as everything else on this site: no title is published until the award, its issuer, its year and its supporting document have been checked.',
      pendingHeading: 'This page is being verified',
      pendingBody:
        'No award is published yet. We would rather show an honest empty page than an impressive one we cannot stand behind, so nothing appears here until a certificate or an official citation has been supplied and checked against the issuing organisation.',
      checklistHeading: 'What we need for each award',
      checklist: [
        'The award title, exactly as the issuing organisation writes it',
        'The issuing organisation and the year it was given',
        'A photograph of the trophy, certificate or citation',
        'One or two sentences on what the award recognises',
        'Permission to publish the photograph on this site',
      ],
      rulesHeading: 'How entries will be handled',
      rules: [
        'The issuer is named in full; a sponsor is never presented as the awarding body.',
        'A nomination, a shortlist place or a participant certificate is never described as a win.',
        'Awards are dated; an old award keeps its year instead of being refreshed.',
        'Nothing is published from a screenshot, an email or a social post alone.',
      ],
      back: 'Back to the collection',
    },
    certifications: {
      title: 'Certifications and quality assurance',
      description:
        'Licences, laboratory reports and quality documents held by Mariyas Naturals, each published with its issuer, scope, dates and document type.',
      eyebrow: 'Quality assurance',
      heading: 'Certifications and quality assurance',
      lede: 'The documents behind the claims: what we hold, who issued it, what it covers and when it expires. Each entry is published with the paper itself, and nothing is described more broadly than the paper allows.',
      pendingHeading: 'This page is being verified',
      pendingBody:
        'No certificate is published yet. The owner has documents in hand; until each one has been read, its scope confirmed and any personal or confidential detail masked, the page stays out of search and out of the sitemap.',
      checklistHeading: 'What we need for each document',
      checklist: [
        'A legible scan or photograph of the whole document, including the number',
        'The issuing authority, exactly as printed',
        'What the document covers, and the products or facility it applies to',
        'Issue date, and expiry date where the document has one',
        'Written instruction on which personal details to mask',
      ],
      kindsHeading: 'Each document is filed by kind',
      kinds: [
        {
          kind: 'manufacturing-licence',
          label: 'Manufacturing licence',
          note: 'Permission to manufacture at a named premises. It is not a product approval.',
        },
        {
          kind: 'laboratory-report',
          label: 'Laboratory report',
          note: 'Results for one sample and one test. It describes that sample, not the whole range.',
        },
        {
          kind: 'quality-certification',
          label: 'Quality certification',
          note: 'A management or process certification, valid for a stated period and scope.',
        },
        {
          kind: 'government-document',
          label: 'Government document',
          note: 'A registration or filing. It is quoted at the level of the document, never wider.',
        },
      ],
      licenceClarification:
        'A manufacturing licence permits manufacture; it is not a Ministry of Ayush product approval and will never be presented as one.',
      redactionNote:
        'Personal names, signatures, phone numbers and internal reference numbers are masked before publication. The redaction is described on the entry, so a reader knows what was removed.',
      back: 'Back to the collection',
    },
    nav: {
      awards: 'Awards',
      certifications: 'Certifications',
      guide: 'Hair oil guide',
    },
  },

  ml: {
    awards: {
      title: 'അവാർഡുകളും അംഗീകാരങ്ങളും',
      description:
        'മരിയാസ് നാച്വറൽസ് കുടുംബത്തിന് ലഭിച്ച അംഗീകാരങ്ങൾ — അവാർഡിന്റെ പേര്, നൽകിയ സംഘടന, വർഷം, രേഖ എന്നിവ പരിശോധിച്ച ശേഷം മാത്രം പ്രസിദ്ധീകരിക്കുന്നു.',
      eyebrow: 'അംഗീകാരം',
      heading: 'അവാർഡുകളും അംഗീകാരങ്ങളും',
      lede: 'കുടുംബത്തിന് ലഭിച്ച അംഗീകാരങ്ങളുടെ രേഖ. ഈ സൈറ്റിലെ മറ്റെല്ലാ കാര്യങ്ങളും പോലെ ഇവിടെയും അതേ കൃത്യത: അവാർഡ്, നൽകിയ സംഘടന, വർഷം, രേഖ എന്നിവ പരിശോധിക്കുന്നതുവരെ ഒന്നും പ്രസിദ്ധീകരിക്കില്ല.',
      pendingHeading: 'ഈ പേജ് പരിശോധനയിലാണ്',
      pendingBody:
        'ഇതുവരെ ഒരു അവാർഡും പ്രസിദ്ധീകരിച്ചിട്ടില്ല. ഉറപ്പിക്കാൻ കഴിയാത്ത ഒരു പേജിനെക്കാൾ സത്യസന്ധമായ ശൂന്യമായ പേജാണ് നല്ലത്. സർട്ടിഫിക്കറ്റോ ഔദ്യോഗിക രേഖയോ ലഭിച്ച് പരിശോധിച്ച ശേഷം മാത്രം ഇവിടെ എന്തെങ്കിലും വരും.',
      checklistHeading: 'ഓരോ അവാർഡിനും വേണ്ടത്',
      checklist: [
        'നൽകിയ സംഘടന എഴുതുന്ന അതേ രൂപത്തിൽ അവാർഡിന്റെ പേര്',
        'നൽകിയ സംഘടനയും വർഷവും',
        'ട്രോഫിയുടെയോ സർട്ടിഫിക്കറ്റിന്റെയോ ഫോട്ടോ',
        'അവാർഡ് എന്തിനാണ് എന്ന് ഒന്നോ രണ്ടോ വാക്യങ്ങൾ',
        'ഫോട്ടോ ഈ സൈറ്റിൽ പ്രസിദ്ധീകരിക്കാനുള്ള അനുമതി',
      ],
      rulesHeading: 'എങ്ങനെ കൈകാര്യം ചെയ്യും',
      rules: [
        'നൽകിയ സംഘടനയുടെ മുഴുവൻ പേര് നൽകും; സ്പോൺസറെ അവാർഡ് നൽകിയവരായി കാണിക്കില്ല.',
        'നാമനിർദ്ദേശം, ഷോർട്ട്‌ലിസ്റ്റ്, പങ്കെടുത്തതിന്റെ സർട്ടിഫിക്കറ്റ് എന്നിവ വിജയമായി വിവരിക്കില്ല.',
        'അവാർഡുകൾക്ക് വർഷം നൽകും; പഴയ അവാർഡിന്റെ വർഷം മാറ്റില്ല.',
        'സ്ക്രീൻഷോട്ട്, ഇമെയിൽ, സോഷ്യൽ പോസ്റ്റ് എന്നിവ മാത്രം അടിസ്ഥാനമാക്കി ഒന്നും പ്രസിദ്ധീകരിക്കില്ല.',
      ],
      back: 'ശേഖരത്തിലേക്ക് മടങ്ങുക',
    },
    certifications: {
      title: 'സർട്ടിഫിക്കേഷനുകളും ഗുണനിലവാര ഉറപ്പും',
      description:
        'മരിയാസ് നാച്വറൽസിന്റെ കൈവശമുള്ള ലൈസൻസുകൾ, ലബോറട്ടറി റിപ്പോർട്ടുകൾ, ഗുണനിലവാര രേഖകൾ — നൽകിയവർ, പരിധി, തീയതികൾ എന്നിവയോടെ.',
      eyebrow: 'ഗുണനിലവാര ഉറപ്പ്',
      heading: 'സർട്ടിഫിക്കേഷനുകളും ഗുണനിലവാര ഉറപ്പും',
      lede: 'വാദങ്ങൾക്ക് പിന്നിലെ രേഖകൾ: എന്താണ് നമ്മുടെ കൈവശം, ആരാണ് നൽകിയത്, എന്താണ് അതിന്റെ പരിധി, എന്ന് കാലഹരണപ്പെടുന്നു. ഓരോ എൻട്രിയും രേഖയോടൊപ്പം പ്രസിദ്ധീകരിക്കും; രേഖ അനുവദിക്കുന്നതിൽ കൂടുതലായി ഒന്നും അവകാശപ്പെടില്ല.',
      pendingHeading: 'ഈ പേജ് പരിശോധനയിലാണ്',
      pendingBody:
        'ഇതുവരെ ഒരു സർട്ടിഫിക്കറ്റും പ്രസിദ്ധീകരിച്ചിട്ടില്ല. ഓരോ രേഖയും വായിച്ച്, പരിധി ഉറപ്പാക്കി, സ്വകാര്യ വിവരങ്ങൾ മറച്ച ശേഷം മാത്രം ഈ പേജ് തിരയലിലും സൈറ്റ്മാപ്പിലും വരും.',
      checklistHeading: 'ഓരോ രേഖയ്ക്കും വേണ്ടത്',
      checklist: [
        'നമ്പർ ഉൾപ്പെടെ മുഴുവൻ രേഖയുടെ വ്യക്തമായ സ്കാൻ അല്ലെങ്കിൽ ഫോട്ടോ',
        'അച്ചടിച്ചിരിക്കുന്ന അതേ രൂപത്തിൽ നൽകിയ അധികാരി',
        'രേഖ എന്തിനെ ഉൾക്കൊള്ളുന്നു, ഏത് ഉൽപ്പന്നങ്ങൾക്കോ സ്ഥലത്തിനോ ബാധകമാണ്',
        'നൽകിയ തീയതി, കാലഹരണ തീയതി ഉണ്ടെങ്കിൽ അതും',
        'ഏത് സ്വകാര്യ വിവരങ്ങൾ മറയ്ക്കണം എന്ന എഴുത്ത്',
      ],
      kindsHeading: 'ഓരോ രേഖയും അതിന്റെ വിഭാഗത്തിൽ',
      kinds: [
        {
          kind: 'manufacturing-licence',
          label: 'നിർമ്മാണ ലൈസൻസ്',
          note: 'ഒരു നിർദ്ദിഷ്ട സ്ഥലത്ത് നിർമ്മിക്കാനുള്ള അനുമതി. ഇത് ഉൽപ്പന്ന അനുമതിയല്ല.',
        },
        {
          kind: 'laboratory-report',
          label: 'ലബോറട്ടറി റിപ്പോർട്ട്',
          note: 'ഒരു സാമ്പിളിന്റെ ഒരു പരിശോധനയുടെ ഫലം. അത് ആ സാമ്പിളിനെ കുറിച്ചാണ്, മുഴുവൻ ശ്രേണിയെ കുറിച്ചല്ല.',
        },
        {
          kind: 'quality-certification',
          label: 'ഗുണനിലവാര സർട്ടിഫിക്കേഷൻ',
          note: 'നിർദ്ദിഷ്ട കാലയളവും പരിധിയും ഉള്ള മാനേജ്മെന്റ് അല്ലെങ്കിൽ പ്രക്രിയ സർട്ടിഫിക്കേഷൻ.',
        },
        {
          kind: 'government-document',
          label: 'സർക്കാർ രേഖ',
          note: 'രജിസ്ട്രേഷനോ രേഖപ്പെടുത്തലോ. രേഖയുടെ തലത്തിൽ മാത്രം ഉദ്ധരിക്കും.',
        },
      ],
      licenceClarification:
        'നിർമ്മാണ ലൈസൻസ് നിർമ്മാണത്തിനുള്ള അനുമതിയാണ്; അത് ആയുഷ് മന്ത്രാലയത്തിന്റെ ഉൽപ്പന്ന അംഗീകാരമല്ല, അങ്ങനെ ഒരിക്കലും അവതരിപ്പിക്കില്ല.',
      redactionNote:
        'പേരുകൾ, ഒപ്പുകൾ, ഫോൺ നമ്പറുകൾ, ആന്തരിക റഫറൻസ് നമ്പറുകൾ എന്നിവ പ്രസിദ്ധീകരണത്തിന് മുൻപ് മറയ്ക്കും. എന്താണ് മറച്ചതെന്ന് എൻട്രിയിൽ വിവരിക്കും.',
      back: 'ശേഖരത്തിലേക്ക് മടങ്ങുക',
    },
    nav: {
      awards: 'അവാർഡുകൾ',
      certifications: 'സർട്ടിഫിക്കറ്റുകൾ',
      guide: 'ഹെയർ ഓയിൽ ഗൈഡ്',
    },
  },

  hi: {
    awards: {
      title: 'पुरस्कार और सम्मान',
      description:
        'मरियास नैचुरल्स परिवार को मिले वास्तविक सम्मान — पुरस्कार का नाम, देने वाली संस्था, वर्ष और दस्तावेज़ जाँचने के बाद ही प्रकाशित।',
      eyebrow: 'सम्मान',
      heading: 'पुरस्कार और सम्मान',
      lede: 'परिवार को मिले सम्मान का रिकॉर्ड, इस साइट के बाकी हिस्सों जैसी ही कसौटी पर: पुरस्कार, देने वाली संस्था, वर्ष और सहायक दस्तावेज़ जाँचे जाने तक कुछ भी प्रकाशित नहीं होता।',
      pendingHeading: 'यह पेज सत्यापन में है',
      pendingBody:
        'अभी कोई पुरस्कार प्रकाशित नहीं है। ऐसे पेज से जिसे हम साबित न कर सकें, एक ईमानदार खाली पेज बेहतर है — प्रमाणपत्र या आधिकारिक उद्धरण मिलकर जाँचे जाने तक यहाँ कुछ नहीं आएगा।',
      checklistHeading: 'हर पुरस्कार के लिए क्या चाहिए',
      checklist: [
        'पुरस्कार का नाम, ठीक वैसे ही जैसे देने वाली संस्था लिखती है',
        'देने वाली संस्था और वर्ष',
        'ट्रॉफ़ी, प्रमाणपत्र या उद्धरण की तस्वीर',
        'एक-दो वाक्यों में, पुरस्कार किस बात के लिए है',
        'तस्वीर इस साइट पर प्रकाशित करने की अनुमति',
      ],
      rulesHeading: 'प्रविष्टियाँ कैसे संभाली जाएँगी',
      rules: [
        'देने वाली संस्था का पूरा नाम दिया जाता है; प्रायोजक को पुरस्कार देने वाला नहीं बताया जाता।',
        'नामांकन, शॉर्टलिस्ट या भागीदारी प्रमाणपत्र को जीत नहीं कहा जाता।',
        'पुरस्कारों पर वर्ष रहता है; पुराने पुरस्कार का वर्ष नहीं बदला जाता।',
        'केवल स्क्रीनशॉट, ईमेल या सोशल पोस्ट के आधार पर कुछ प्रकाशित नहीं होता।',
      ],
      back: 'संग्रह पर वापस',
    },
    certifications: {
      title: 'प्रमाणन और गुणवत्ता आश्वासन',
      description:
        'मरियास नैचुरल्स के पास मौजूद लाइसेंस, प्रयोगशाला रिपोर्ट और गुणवत्ता दस्तावेज़ — जारीकर्ता, दायरे और तिथियों के साथ।',
      eyebrow: 'गुणवत्ता आश्वासन',
      heading: 'प्रमाणन और गुणवत्ता आश्वासन',
      lede: 'दावों के पीछे के दस्तावेज़: हमारे पास क्या है, किसने जारी किया, क्या दायरा है और कब तक मान्य है। हर प्रविष्टि दस्तावेज़ के साथ प्रकाशित होती है, और दस्तावेज़ से बड़ा दावा कभी नहीं किया जाता।',
      pendingHeading: 'यह पेज सत्यापन में है',
      pendingBody:
        'अभी कोई प्रमाणपत्र प्रकाशित नहीं है। हर दस्तावेज़ पढ़े जाने, उसका दायरा तय होने और निजी जानकारी छिपाए जाने तक यह पेज खोज और साइटमैप से बाहर रहता है।',
      checklistHeading: 'हर दस्तावेज़ के लिए क्या चाहिए',
      checklist: [
        'नंबर सहित पूरे दस्तावेज़ का स्पष्ट स्कैन या फोटो',
        'जारीकर्ता प्राधिकरण, ठीक वैसे ही जैसे छपा है',
        'दस्तावेज़ किसे कवर करता है, किन उत्पादों या परिसर पर लागू है',
        'जारी तिथि, और समाप्ति तिथि यदि हो',
        'कौन-सी निजी जानकारी छिपानी है, इसका लिखित निर्देश',
      ],
      kindsHeading: 'हर दस्तावेज़ अपनी श्रेणी में',
      kinds: [
        {
          kind: 'manufacturing-licence',
          label: 'विनिर्माण लाइसेंस',
          note: 'किसी नामित परिसर में निर्माण की अनुमति। यह उत्पाद अनुमोदन नहीं है।',
        },
        {
          kind: 'laboratory-report',
          label: 'प्रयोगशाला रिपोर्ट',
          note: 'एक नमूने और एक परीक्षण का परिणाम। यह उस नमूने का है, पूरी श्रृंखला का नहीं।',
        },
        {
          kind: 'quality-certification',
          label: 'गुणवत्ता प्रमाणन',
          note: 'प्रबंधन या प्रक्रिया का प्रमाणन, तय अवधि और दायरे के साथ।',
        },
        {
          kind: 'government-document',
          label: 'सरकारी दस्तावेज़',
          note: 'पंजीकरण या फाइलिंग। दस्तावेज़ के स्तर पर ही उद्धृत, उससे बड़ा कभी नहीं।',
        },
      ],
      licenceClarification:
        'विनिर्माण लाइसेंस निर्माण की अनुमति देता है; यह आयुष मंत्रालय का उत्पाद अनुमोदन नहीं है और इसे कभी वैसा नहीं दिखाया जाएगा।',
      redactionNote:
        'नाम, हस्ताक्षर, फ़ोन नंबर और आंतरिक संदर्भ संख्याएँ प्रकाशन से पहले छिपाई जाती हैं। क्या हटाया गया, यह प्रविष्टि पर लिखा जाता है।',
      back: 'संग्रह पर वापस',
    },
    nav: {
      awards: 'पुरस्कार',
      certifications: 'प्रमाणन',
      guide: 'हेयर ऑयल गाइड',
    },
  },

  ta: {
    awards: {
      title: 'விருதுகள் மற்றும் அங்கீகாரங்கள்',
      description:
        'மரியாஸ் நேச்சுரல்ஸ் குடும்பம் பெற்ற உண்மையான அங்கீகாரங்கள் — விருது பெயர், வழங்கிய அமைப்பு, ஆண்டு, ஆவணம் சரிபார்க்கப்பட்ட பிறகே வெளியிடப்படும்.',
      eyebrow: 'அங்கீகாரம்',
      heading: 'விருதுகள் மற்றும் அங்கீகாரங்கள்',
      lede: 'குடும்பம் பெற்ற அங்கீகாரங்களின் பதிவு. இந்த தளத்தின் மற்ற பகுதிகளைப் போலவே இங்கும் அதே தரம்: விருது, வழங்கிய அமைப்பு, ஆண்டு, ஆவணம் ஆகியவை சரிபார்க்கப்படும் வரை எதுவும் வெளியிடப்படாது.',
      pendingHeading: 'இந்தப் பக்கம் சரிபார்ப்பில் உள்ளது',
      pendingBody:
        'இதுவரை எந்த விருதும் வெளியிடப்படவில்லை. உறுதி செய்ய முடியாத பக்கத்தை விட நேர்மையான காலிப் பக்கம் நல்லது — சான்றிதழோ அதிகாரப்பூர்வ ஆவணமோ கிடைத்து சரிபார்க்கப்பட்ட பிறகே இங்கே ஏதேனும் தோன்றும்.',
      checklistHeading: 'ஒவ்வொரு விருதுக்கும் தேவையானவை',
      checklist: [
        'வழங்கிய அமைப்பு எழுதும் அதே வடிவில் விருதின் பெயர்',
        'வழங்கிய அமைப்பு மற்றும் ஆண்டு',
        'கோப்பை அல்லது சான்றிதழின் புகைப்படம்',
        'விருது எதற்கானது என்பதை ஒன்றிரண்டு வாக்கியங்களில்',
        'புகைப்படத்தை இந்தத் தளத்தில் வெளியிட அனுமதி',
      ],
      rulesHeading: 'பதிவுகள் எப்படி கையாளப்படும்',
      rules: [
        'வழங்கிய அமைப்பின் முழுப் பெயர் தரப்படும்; ஸ்பான்சரை விருது வழங்கியவராகக் காட்ட மாட்டோம்.',
        'பரிந்துரை, குறுகியப் பட்டியல், பங்கேற்புச் சான்றிதழ் ஆகியவை வெற்றி என்று சொல்லப்படா.',
        'விருதுகளுக்கு ஆண்டு இருக்கும்; பழைய விருதின் ஆண்டு மாற்றப்படாது.',
        'ஸ்கிரீன்ஷாட், மின்னஞ்சல், சமூகப் பதிவு மட்டும் கொண்டு எதுவும் வெளியிடப்படாது.',
      ],
      back: 'தொகுப்புக்குத் திரும்பு',
    },
    certifications: {
      title: 'சான்றிதழ்கள் மற்றும் தர உறுதி',
      description:
        'மரியாஸ் நேச்சுரல்ஸிடம் உள்ள உரிமங்கள், ஆய்வக அறிக்கைகள், தர ஆவணங்கள் — வழங்கியவர், எல்லை, தேதிகளுடன்.',
      eyebrow: 'தர உறுதி',
      heading: 'சான்றிதழ்கள் மற்றும் தர உறுதி',
      lede: 'கூற்றுகளுக்குப் பின்னால் உள்ள ஆவணங்கள்: எங்கிடம் என்ன இருக்கிறது, யார் வழங்கியது, எதை உள்ளடக்குகிறது, எப்போது முடிகிறது. ஒவ்வொரு பதிவும் ஆவணத்துடன் வெளியிடப்படும்; ஆவணம் அனுமதிப்பதற்கு மேல் எதுவும் கூறப்படாது.',
      pendingHeading: 'இந்தப் பக்கம் சரிபார்ப்பில் உள்ளது',
      pendingBody:
        'இதுவரை எந்தச் சான்றிதழும் வெளியிடப்படவில்லை. ஒவ்வொரு ஆவணமும் படிக்கப்பட்டு, அதன் எல்லை உறுதி செய்யப்பட்டு, தனிப்பட்ட தகவல்கள் மறைக்கப்பட்ட பிறகே இந்தப் பக்கம் தேடல் மற்றும் சைட்மேப்பில் சேரும்.',
      checklistHeading: 'ஒவ்வொரு ஆவணத்திற்கும் தேவையானவை',
      checklist: [
        'எண் உட்பட முழு ஆவணத்தின் தெளிவான ஸ்கேன் அல்லது புகைப்படம்',
        'அச்சிடப்பட்ட அதே வடிவில் வழங்கிய அதிகாரி',
        'ஆவணம் எதை உள்ளடக்குகிறது, எந்தப் பொருட்களுக்கோ இடத்திற்கோ பொருந்தும்',
        'வழங்கிய தேதி, முடிவுத் தேதி இருந்தால் அதுவும்',
        'எந்தத் தனிப்பட்ட தகவல்களை மறைக்க வேண்டும் என்பதற்கான எழுத்துப்பூர்வ அறிவுறுத்தல்',
      ],
      kindsHeading: 'ஒவ்வொரு ஆவணமும் அதன் வகையில்',
      kinds: [
        {
          kind: 'manufacturing-licence',
          label: 'உற்பத்தி உரிமம்',
          note: 'ஒரு குறிப்பிட்ட இடத்தில் உற்பத்தி செய்ய அனுமதி. இது பொருள் ஒப்புதல் அல்ல.',
        },
        {
          kind: 'laboratory-report',
          label: 'ஆய்வக அறிக்கை',
          note: 'ஒரு மாதிரிக்கு ஒரு பரிசோதனையின் முடிவு. அது அந்த மாதிரியைப் பற்றியது, முழுத் தொகுப்பைப் பற்றியதல்ல.',
        },
        {
          kind: 'quality-certification',
          label: 'தரச் சான்றிதழ்',
          note: 'குறிப்பிட்ட காலமும் எல்லையும் கொண்ட நிர்வாக அல்லது செயல்முறைச் சான்றிதழ்.',
        },
        {
          kind: 'government-document',
          label: 'அரசு ஆவணம்',
          note: 'பதிவு அல்லது ஆவணப்படுத்தல். ஆவணத்தின் அளவில் மட்டுமே மேற்கோள் காட்டப்படும்.',
        },
      ],
      licenceClarification:
        'உற்பத்தி உரிமம் உற்பத்திக்கான அனுமதி; அது ஆயுஷ் அமைச்சின் பொருள் ஒப்புதல் அல்ல, ஒருபோதும் அப்படிக் காட்டப்படாது.',
      redactionNote:
        'பெயர்கள், கையொப்பங்கள், தொலைபேசி எண்கள், உள் குறிப்பு எண்கள் ஆகியவை வெளியீட்டுக்கு முன் மறைக்கப்படும். என்ன நீக்கப்பட்டது என்பது பதிவில் எழுதப்படும்.',
      back: 'தொகுப்புக்குத் திரும்பு',
    },
    nav: {
      awards: 'விருதுகள்',
      certifications: 'சான்றிதழ்கள்',
      guide: 'ஹேர் ஆயில் வழிகாட்டி',
    },
  },

  kn: {
    awards: {
      title: 'ಪ್ರಶಸ್ತಿಗಳು ಮತ್ತು ಮಾನ್ಯತೆಗಳು',
      description:
        'ಮರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಕುಟುಂಬಕ್ಕೆ ಸಿಕ್ಕ ನಿಜವಾದ ಮಾನ್ಯತೆಗಳು — ಪ್ರಶಸ್ತಿಯ ಹೆಸರು, ನೀಡಿದ ಸಂಸ್ಥೆ, ವರ್ಷ ಮತ್ತು ದಾಖಲೆ ಪರಿಶೀಲಿಸಿದ ನಂತರವೇ ಪ್ರಕಟಣೆ.',
      eyebrow: 'ಮಾನ್ಯತೆ',
      heading: 'ಪ್ರಶಸ್ತಿಗಳು ಮತ್ತು ಮಾನ್ಯತೆಗಳು',
      lede: 'ಕುಟುಂಬಕ್ಕೆ ಸಿಕ್ಕ ಮಾನ್ಯತೆಗಳ ದಾಖಲೆ. ಈ ತಾಣದ ಉಳಿದ ಭಾಗಗಳಂತೆಯೇ ಅದೇ ಮಾನದಂಡ: ಪ್ರಶಸ್ತಿ, ನೀಡಿದ ಸಂಸ್ಥೆ, ವರ್ಷ ಮತ್ತು ದಾಖಲೆ ಪರಿಶೀಲನೆಯಾಗುವವರೆಗೆ ಏನನ್ನೂ ಪ್ರಕಟಿಸುವುದಿಲ್ಲ.',
      pendingHeading: 'ಈ ಪುಟ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
      pendingBody:
        'ಇಲ್ಲಿಯವರೆಗೆ ಯಾವುದೇ ಪ್ರಶಸ್ತಿ ಪ್ರಕಟವಾಗಿಲ್ಲ. ಸಾಬೀತುಪಡಿಸಲಾಗದ ಪುಟಕ್ಕಿಂತ ಪ್ರಾಮಾಣಿಕ ಖಾಲಿ ಪುಟ ಉತ್ತಮ — ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಅಧಿಕೃತ ದಾಖಲೆ ಸಿಕ್ಕು ಪರಿಶೀಲನೆಯಾದ ನಂತರವೇ ಇಲ್ಲಿ ಏನಾದರೂ ಕಾಣಿಸುತ್ತದೆ.',
      checklistHeading: 'ಪ್ರತಿ ಪ್ರಶಸ್ತಿಗೆ ಬೇಕಾದದ್ದು',
      checklist: [
        'ನೀಡಿದ ಸಂಸ್ಥೆ ಬರೆಯುವ ಅದೇ ರೂಪದಲ್ಲಿ ಪ್ರಶಸ್ತಿಯ ಹೆಸರು',
        'ನೀಡಿದ ಸಂಸ್ಥೆ ಮತ್ತು ವರ್ಷ',
        'ಟ್ರೋಫಿ ಅಥವಾ ಪ್ರಮಾಣಪತ್ರದ ಛಾಯಾಚಿತ್ರ',
        'ಪ್ರಶಸ್ತಿ ಯಾವುದಕ್ಕೆ ಎಂಬುದನ್ನು ಒಂದೆರಡು ವಾಕ್ಯಗಳಲ್ಲಿ',
        'ಛಾಯಾಚಿತ್ರವನ್ನು ಈ ತಾಣದಲ್ಲಿ ಪ್ರಕಟಿಸಲು ಅನುಮತಿ',
      ],
      rulesHeading: 'ನಮೂದುಗಳನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ',
      rules: [
        'ನೀಡಿದ ಸಂಸ್ಥೆಯ ಪೂರ್ಣ ಹೆಸರು ನೀಡಲಾಗುತ್ತದೆ; ಪ್ರಾಯೋಜಕರನ್ನು ಪ್ರಶಸ್ತಿ ನೀಡಿದವರೆಂದು ತೋರಿಸುವುದಿಲ್ಲ.',
        'ನಾಮನಿರ್ದೇಶನ, ಶಾರ್ಟ್‌ಲಿಸ್ಟ್, ಭಾಗವಹಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಗೆಲುವು ಎಂದು ಹೇಳುವುದಿಲ್ಲ.',
        'ಪ್ರಶಸ್ತಿಗಳಿಗೆ ವರ್ಷ ಇರುತ್ತದೆ; ಹಳೆಯ ಪ್ರಶಸ್ತಿಯ ವರ್ಷ ಬದಲಾಗುವುದಿಲ್ಲ.',
        'ಸ್ಕ್ರೀನ್‌ಶಾಟ್, ಇಮೇಲ್ ಅಥವಾ ಸಾಮಾಜಿಕ ಪೋಸ್ಟ್ ಮಾತ್ರದ ಆಧಾರದಲ್ಲಿ ಏನನ್ನೂ ಪ್ರಕಟಿಸುವುದಿಲ್ಲ.',
      ],
      back: 'ಸಂಗ್ರಹಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    },
    certifications: {
      title: 'ಪ್ರಮಾಣೀಕರಣಗಳು ಮತ್ತು ಗುಣಮಟ್ಟದ ಭರವಸೆ',
      description:
        'ಮರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್ ಹೊಂದಿರುವ ಪರವಾನಗಿಗಳು, ಪ್ರಯೋಗಾಲಯ ವರದಿಗಳು, ಗುಣಮಟ್ಟದ ದಾಖಲೆಗಳು — ನೀಡಿದವರು, ವ್ಯಾಪ್ತಿ, ದಿನಾಂಕಗಳೊಂದಿಗೆ.',
      eyebrow: 'ಗುಣಮಟ್ಟದ ಭರವಸೆ',
      heading: 'ಪ್ರಮಾಣೀಕರಣಗಳು ಮತ್ತು ಗುಣಮಟ್ಟದ ಭರವಸೆ',
      lede: 'ಹೇಳಿಕೆಗಳ ಹಿಂದಿನ ದಾಖಲೆಗಳು: ನಮ್ಮಲ್ಲಿ ಏನಿದೆ, ಯಾರು ನೀಡಿದ್ದಾರೆ, ವ್ಯಾಪ್ತಿ ಎಷ್ಟು, ಯಾವಾಗ ಮುಗಿಯುತ್ತದೆ. ಪ್ರತಿ ನಮೂದು ದಾಖಲೆಯೊಂದಿಗೆ ಪ್ರಕಟವಾಗುತ್ತದೆ; ದಾಖಲೆ ಅನುಮತಿಸುವುದಕ್ಕಿಂತ ಹೆಚ್ಚು ಹೇಳುವುದಿಲ್ಲ.',
      pendingHeading: 'ಈ ಪುಟ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
      pendingBody:
        'ಇಲ್ಲಿಯವರೆಗೆ ಯಾವುದೇ ಪ್ರಮಾಣಪತ್ರ ಪ್ರಕಟವಾಗಿಲ್ಲ. ಪ್ರತಿ ದಾಖಲೆಯನ್ನೂ ಓದಿ, ವ್ಯಾಪ್ತಿ ಖಚಿತಪಡಿಸಿ, ಖಾಸಗಿ ಮಾಹಿತಿ ಮರೆಮಾಡಿದ ನಂತರವೇ ಈ ಪುಟ ಹುಡುಕಾಟ ಮತ್ತು ಸೈಟ್‌ಮ್ಯಾಪ್‌ಗೆ ಸೇರುತ್ತದೆ.',
      checklistHeading: 'ಪ್ರತಿ ದಾಖಲೆಗೆ ಬೇಕಾದದ್ದು',
      checklist: [
        'ಸಂಖ್ಯೆ ಸಹಿತ ಇಡೀ ದಾಖಲೆಯ ಸ್ಪಷ್ಟ ಸ್ಕ್ಯಾನ್ ಅಥವಾ ಛಾಯಾಚಿತ್ರ',
        'ಮುದ್ರಿತ ಅದೇ ರೂಪದಲ್ಲಿ ನೀಡಿದ ಪ್ರಾಧಿಕಾರ',
        'ದಾಖಲೆ ಏನನ್ನು ಒಳಗೊಳ್ಳುತ್ತದೆ, ಯಾವ ಉತ್ಪನ್ನಗಳಿಗೆ ಅಥವಾ ಸ್ಥಳಕ್ಕೆ ಅನ್ವಯಿಸುತ್ತದೆ',
        'ನೀಡಿದ ದಿನಾಂಕ, ಅವಧಿ ಮುಗಿಯುವ ದಿನಾಂಕ ಇದ್ದರೆ ಅದೂ',
        'ಯಾವ ಖಾಸಗಿ ಮಾಹಿತಿಯನ್ನು ಮರೆಮಾಡಬೇಕು ಎಂಬ ಲಿಖಿತ ಸೂಚನೆ',
      ],
      kindsHeading: 'ಪ್ರತಿ ದಾಖಲೆಯೂ ತನ್ನ ವರ್ಗದಲ್ಲಿ',
      kinds: [
        {
          kind: 'manufacturing-licence',
          label: 'ತಯಾರಿಕಾ ಪರವಾನಗಿ',
          note: 'ನಿರ್ದಿಷ್ಟ ಸ್ಥಳದಲ್ಲಿ ತಯಾರಿಸಲು ಅನುಮತಿ. ಇದು ಉತ್ಪನ್ನ ಅನುಮೋದನೆ ಅಲ್ಲ.',
        },
        {
          kind: 'laboratory-report',
          label: 'ಪ್ರಯೋಗಾಲಯ ವರದಿ',
          note: 'ಒಂದು ಮಾದರಿಗೆ ಒಂದು ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ. ಅದು ಆ ಮಾದರಿಗೆ ಸಂಬಂಧಿಸಿದ್ದು, ಇಡೀ ಶ್ರೇಣಿಗೆ ಅಲ್ಲ.',
        },
        {
          kind: 'quality-certification',
          label: 'ಗುಣಮಟ್ಟ ಪ್ರಮಾಣೀಕರಣ',
          note: 'ನಿರ್ದಿಷ್ಟ ಅವಧಿ ಮತ್ತು ವ್ಯಾಪ್ತಿ ಇರುವ ನಿರ್ವಹಣಾ ಅಥವಾ ಪ್ರಕ್ರಿಯೆ ಪ್ರಮಾಣೀಕರಣ.',
        },
        {
          kind: 'government-document',
          label: 'ಸರ್ಕಾರಿ ದಾಖಲೆ',
          note: 'ನೋಂದಣಿ ಅಥವಾ ದಾಖಲೀಕರಣ. ದಾಖಲೆಯ ಮಟ್ಟದಲ್ಲಿ ಮಾತ್ರ ಉಲ್ಲೇಖ.',
        },
      ],
      licenceClarification:
        'ತಯಾರಿಕಾ ಪರವಾನಗಿ ತಯಾರಿಕೆಗೆ ಅನುಮತಿ ನೀಡುತ್ತದೆ; ಅದು ಆಯುಷ್ ಸಚಿವಾಲಯದ ಉತ್ಪನ್ನ ಅನುಮೋದನೆ ಅಲ್ಲ, ಎಂದಿಗೂ ಹಾಗೆ ತೋರಿಸುವುದಿಲ್ಲ.',
      redactionNote:
        'ಹೆಸರುಗಳು, ಸಹಿಗಳು, ದೂರವಾಣಿ ಸಂಖ್ಯೆಗಳು ಮತ್ತು ಆಂತರಿಕ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಗಳನ್ನು ಪ್ರಕಟಣೆಗೆ ಮೊದಲು ಮರೆಮಾಡಲಾಗುತ್ತದೆ. ಏನನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ ಎಂಬುದನ್ನು ನಮೂದಿನಲ್ಲಿ ಬರೆಯಲಾಗುತ್ತದೆ.',
      back: 'ಸಂಗ್ರಹಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    },
    nav: {
      awards: 'ಪ್ರಶಸ್ತಿಗಳು',
      certifications: 'ಪ್ರಮಾಣಪತ್ರಗಳು',
      guide: 'ಹೇರ್ ಆಯಿಲ್ ಮಾರ್ಗದರ್ಶಿ',
    },
  },
};
