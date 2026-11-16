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
 * VERIFIED 2026-11-16 by opening the listing directly and reading it. The owner
 * supplied a share link (https://share.google/QQsEHUgqgWKfDj4AF) which resolves
 * to this Maps place; `href` below is the canonical form of that place (Maps
 * CID), so it keeps working after the share shortcode expires.
 *
 * What the listing itself says:
 *   - name "Mariyas Naturals", category "Herb shop"
 *   - 4.2 stars from 574 reviews
 *   - "Avalookkunnu P.O, Mammood, Aryad South, Alappuzha, Keralam 688006"
 *   - site mariyasnaturals.com, phone +91 90488 88395 (the ORDER line)
 *   - "Identifies as women-owned"
 *
 * The rating and count are a dated reading, not a live value: Google revises
 * them continuously, so `ratingReviewedOn` records when we last looked.
 */
export const googleBusiness = Object.freeze({
  href: 'https://maps.google.com/?cid=12669174919246619705',
  name: 'Mariyas Naturals',
  category: 'Herb shop',
  /** As displayed by Google on `ratingReviewedOn`. */
  rating: 4.2,
  reviewCount: 574,
  ratingReviewedOn: '2026-11-16',
  /**
   * The listing's own address wording. Deliberately kept separate from
   * `postalAddress`: it describes the same locality in a different format
   * (Mammood / Aryad South vs Thalavady South S.O), so neither overwrites the
   * other until the owner confirms which is the public walk-in address.
   */
  listingAddress:
    'Avalookkunnu P.O, Mammood, Aryad South, Alappuzha, Keralam 688006',
  /** The listing's phone line. Distinct from the customer WhatsApp number. */
  orderLine: '+91 90488 88395',
  verifiedOn: '2026-11-16',
  evidence:
    'Owner-supplied share link resolved to the Maps listing; name, category, rating, review count, address and phone read directly off that listing.',
});

/** Storefront entry points. Purchases always finish on the official store. */
export const legalLinks = Object.freeze({
  shop: 'https://www.mariyasnaturals.com/shop/',
  shipping: 'https://www.mariyasnaturals.com/shipping-delivery/',
  contact: 'https://www.mariyasnaturals.com/contact-us/',
});
