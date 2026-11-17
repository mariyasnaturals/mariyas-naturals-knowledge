/**
 * The claim registry — the single place where a marketing statement is allowed
 * to exist, and the gate that decides whether it may be published.
 *
 * Rule: a claim is rendered only when `status === 'published'`. Everything else
 * lives here as a record of what we *would* say, what evidence is missing and
 * who has to approve it, so it can be reviewed without being published by
 * accident. `scripts/validate-seo.mjs` fails the build if a `forbidden` phrase
 * from this file reaches any HTML output.
 *
 * Nothing in this file is an ingredient, a certificate, an award or a test
 * result. No names, botanical identifications, concentrations, issuers, dates or
 * results have been invented; where a fact is missing, the record says so.
 */
import type { Locale } from '../i18n';

export type ClaimStatus =
  /** Evidence checked and the exact wording approved — may be rendered. */
  | 'published'
  /** Plausible, owner-reported, but the supporting document has not been read. */
  | 'pending-verification'
  /** Reviewed and refused: misleading, unsubstantiated or medically regulated. */
  | 'not-approved';

export interface Claim {
  id: string;
  /** The sentence we would publish, once approved. Never rendered otherwise. */
  wording: Readonly<Record<Locale, string>> | null;
  status: ClaimStatus;
  /** Surfaces that would carry it after approval. */
  surfaces: readonly string[];
  /** Documents the owner must supply before this can be reviewed. */
  evidenceRequired: readonly string[];
  /** A known inconsistency that has to be resolved first. */
  conflict?: string;
  /** Who has to sign the wording off; absent means nobody has looked yet. */
  reviewer?: 'owner' | 'owner + compliance' | 'none';
  notes: string;
}

export const claims: readonly Claim[] = Object.freeze([
  {
    id: 'hair-oil-60-ingredients',
    wording: {
      en: 'The Mariyas Herbal Hair Care Oil is formulated with 60 ingredients.',
      ml: 'മാരിയാസ് ഹെർബൽ ഹെയർ കെയർ ഓയിലിൽ 60 ചേരുവകളുണ്ട്.',
      hi: 'मारियाज़ हर्बल हेयर केयर ऑयल 60 सामग्रियों से बनाया गया है।',
      ta: 'மரியாஸ் ஹெர்பல் ஹேர் கேர் ஆயிலில் 60 மூலப்பொருட்கள் உள்ளன.',
      kn: 'ಮಾರಿಯಾಸ್ ಹರ್ಬಲ್ ಹೇರ್ ಕೇರ್ ಆಯಿಲ್ 60 ಪದಾರ್ಥಗಳಿಂದ ತಯಾರಾಗಿದೆ.',
    },
    status: 'pending-verification',
    surfaces: [
      'hair-oil pillar',
      'product pages',
      'assistant',
      'structured data',
    ],
    evidenceRequired: [
      'The formulation sheet or batch manufacturing record that lists the ingredients, with a count we can check ourselves.',
      'The owner-approved public wording, in English and in each of the four translations.',
      'Confirmation of which of the 60 are named on the pack, and whether any are present only as processing aids.',
    ],
    conflict:
      'The official .com listing has described the formulation as "approximately 50 herbs". Two different numbers are in circulation; publishing either before the sheet is read would put a number on the site that the pack and the store may contradict.',
    reviewer: 'owner',
    notes:
      'Owner-confirmed as 60. Held back because the supporting document has not been supplied, and because the count must not be presented as a competitive superlative.',
  },
  {
    id: 'chemical-free-blanket',
    wording: {
      en: 'Chemical-free.',
      ml: 'രാസവസ്തുക്കളില്ല.',
      hi: 'रसायन-मुक्त।',
      ta: 'இரசாயனமற்றது.',
      kn: 'ರಾಸಾಯನಿಕ ಮುಕ್ತ.',
    },
    status: 'not-approved',
    surfaces: ['product pages', 'pillar', 'badges'],
    evidenceRequired: [
      'A laboratory report or manufacturer declaration naming the specific substance(s) that are asserted to be absent.',
      'Approved wording of the precise form, e.g. "No added mineral oil", "No added synthetic fragrance", "No added parabens".',
    ],
    notes:
      'A blanket "chemical-free" statement is scientifically meaningless on a product made of herbs, water and oils — every ingredient is a chemical — and it is the kind of absolute claim a regulator can ask us to prove. Replace with a specific, testable statement once the report is in hand.',
  },
  {
    id: 'ayush-approval',
    wording: null,
    status: 'not-approved',
    surfaces: ['certifications page', 'product pages'],
    evidenceRequired: [
      'Only a Ministry of Ayush product approval or licence number, if one exists.',
    ],
    notes:
      'A manufacturing licence (drugs/ayurvedic manufacturing licence issued under state authority) is not a product approval and must never be presented as one. The certifications page labels each document by kind for exactly this reason.',
  },
  {
    id: 'kerala-only-superlative',
    wording: null,
    status: 'not-approved',
    surfaces: ['pillar', 'homepage'],
    evidenceRequired: [
      'Independent market survey covering every competing Kerala product.',
    ],
    notes:
      '"Kerala\'s only 60-ingredient hair oil" is a superlative about the whole market. It cannot be substantiated from our own documents, so it is refused outright rather than softened.',
  },
  {
    id: 'hair-regrowth-guarantee',
    wording: null,
    status: 'not-approved',
    surfaces: ['pillar', 'product pages', 'assistant', 'ads'],
    evidenceRequired: [
      'Nothing available to us can substantiate a treatment claim; this is medically regulated.',
    ],
    notes:
      'No regrowth, restoration, cure or treatment promise, and no implication that a customer review proves one. Reviews are opinions and are published as opinions.',
  },
  {
    id: 'kerala-manufacture-location',
    wording: {
      en: 'Made in Kerala, India — Alappuzha district, the address printed on the pack and on the official store.',
      ml: 'കേരളത്തിൽ, ആലപ്പുഴ ജില്ലയിൽ നിർമ്മിച്ചത് — പായ്ക്കറ്റിലും ഔദ്യോഗിക സ്റ്റോറിലും അച്ചടിച്ച വിലാസം.',
      hi: 'केरल, भारत में निर्मित — अलप्पुझा ज़िला, वही पता जो पैक और आधिकारिक स्टोर पर छपा है।',
      ta: 'கேரளாவில், ஆலப்புழா மாவட்டத்தில் தயாரிக்கப்பட்டது — பேக்கிலும் அதிகாரப்பூர்வ ஸ்டோரிலும் அச்சிடப்பட்ட முகவரி.',
      kn: 'ಕೇರಳದ ಅಲಪ್ಪುಳ ಜಿಲ್ಲೆಯಲ್ಲಿ ತಯಾರಿಸಲಾಗಿದೆ — ಪ್ಯಾಕ್ ಮತ್ತು ಅಧಿಕೃತ ಸ್ಟೋರ್‌ನಲ್ಲಿ ಮುದ್ರಿಸಿರುವ ವಿಳಾಸ.',
    },
    status: 'published',
    surfaces: ['pillar', 'assistant', 'footer'],
    evidenceRequired: [],
    reviewer: 'none',
    notes:
      'Restates the postal address already published by the official store and verified on 2026-11-16. It claims a location, not a facility licence or a capacity.',
  },
]);

/** Claims that must never appear in built HTML, whatever the surface. */
export const forbiddenPhrases: readonly { phrase: string; claimId: string }[] =
  Object.freeze(
    (
      [
        ['chemical-free', 'chemical-free-blanket'],
        ['chemical free', 'chemical-free-blanket'],
        ['chemically free', 'chemical-free-blanket'],
        ['60-ingredient', 'hair-oil-60-ingredients'],
        ['60 ingredient', 'hair-oil-60-ingredients'],
        ['60 herbs', 'hair-oil-60-ingredients'],
        ['approximately 50 herbs', 'hair-oil-60-ingredients'],
        ['about 50 herbs', 'hair-oil-60-ingredients'],
        ['ayush approved', 'ayush-approval'],
        ['ayush-certified', 'ayush-approval'],
        ['guaranteed regrowth', 'hair-regrowth-guarantee'],
        ['guaranteed hair growth', 'hair-regrowth-guarantee'],
        ['clinically proven', 'hair-regrowth-guarantee'],
        ['kerala’s only', 'kerala-only-superlative'],
        ["kerala's only", 'kerala-only-superlative'],
        ['only 60-ingredient', 'kerala-only-superlative'],
        ['fda approved', 'ayush-approval'],
      ] as const
    ).map(([phrase, claimId]) => ({ phrase, claimId })),
  );

/** A claim's sentence, but only once it is published. */
export const claimText = (id: string, lang: Locale): string | null => {
  const claim = claims.find((entry) => entry.id === id);
  if (!claim || claim.status !== 'published' || !claim.wording) return null;
  return claim.wording[lang] ?? claim.wording.en;
};
