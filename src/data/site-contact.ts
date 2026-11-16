/**
 * Owner-verified contact and social data for the footer and the Ritual Finder.
 *
 * Each entry records HOW it was verified, so a later reviewer can re-check it
 * without guessing. Anything that could not be verified is deliberately absent
 * and the UI degrades to an honest "to be confirmed" state instead of a guess.
 */

/** Exactly one primary WhatsApp number. Never render a second one. */
export const whatsapp = Object.freeze({
  display: '+91 90488 88 394',
  /** wa.me requires the international number with no spaces or plus sign. */
  href: 'https://wa.me/919048888394',
  verifiedOn: '2026-11-16',
  evidence:
    'Official store contact blurb and phone block both list "Whatsapp: +91 90488 88 394" (the +91 90488 88 395 line is the order line and is linked separately).',
});

export const email = Object.freeze({
  display: 'enquiry@mariyasnaturals.com',
  href: 'mailto:enquiry@mariyasnaturals.com',
  verifiedOn: '2026-11-16',
  evidence: 'Official store footer and Contact Us page.',
});

export const postalAddress = Object.freeze({
  /** Full postal form, exactly as the brief specifies. */
  display:
    'Mariyas, 4/625 Kalath Ward, Thalavady South S.O, Avalookkunnu P.O, Alappuzha – 688006, Kerala',
  verifiedOn: '2026-11-16',
  evidence:
    'Official store footer and Contact Us page carry the same address line.',
});

/**
 * Social profiles.
 *
 * `instagram` was opened and read directly: the profile is named MARIYAS HERBAL
 * HAIRCARE OIL (@mariyas_herbal_hair_care_oil), links to mariyasnaturals.com and
 * posts Mariyas product content. `facebook` is the URL the official store itself
 * declares in its own Organization structured data; the page refuses anonymous
 * fetches (HTTP 403), so it is recorded as owner-declared rather than read.
 */
export const social = Object.freeze({
  instagram: {
    label: 'Instagram',
    href: 'https://www.instagram.com/mariyas_herbal_hair_care_oil/',
    verifiedOn: '2026-11-16',
    evidence: 'Profile opened directly; bio links to mariyasnaturals.com.',
  },
  facebook: {
    label: 'Facebook',
    href: 'https://www.facebook.com/mariayasnaturals/',
    verifiedOn: '2026-11-16',
    evidence:
      "Declared in the official store's own Organization sameAs data; page returns HTTP 403 to anonymous fetches.",
  },
});

/**
 * Google Business Profile / Maps.
 *
 * NOT VERIFIED. The owner has not supplied the exact listing URL and no search
 * result could be tied to this business with certainty, so the footer renders a
 * non-linked "to be confirmed" note rather than sending customers to the wrong
 * listing. Fill `href` only after the owner confirms the exact profile.
 */
export const googleBusiness: { href?: string; verifiedOn?: string } =
  Object.freeze({});

/** Storefront entry points. Purchases always finish on the official store. */
export const legalLinks = Object.freeze({
  shop: 'https://www.mariyasnaturals.com/shop/',
  shipping: 'https://www.mariyasnaturals.com/shipping-delivery/',
  contact: 'https://www.mariyasnaturals.com/contact-us/',
});
