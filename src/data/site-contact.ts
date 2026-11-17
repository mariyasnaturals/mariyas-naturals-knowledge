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
 * Each record keeps three things apart: the destination the site links to, the
 * link the owner supplied, and the evidence for the destination. The components
 * read only `href`, so every Facebook button and every Instagram button on the
 * site points at the same verified place.
 *
 * `instagram` — the owner supplied
 * `https://www.instagram.com/mariyas_herbal_hair_care_oil?srtk=…`. The profile was
 * opened directly: it is named MARIYAS HERBAL HAIRCARE OIL, its bio links to
 * mariyasnaturals.com and it posts Mariyas product content. `href` below is the
 * same profile without the share-tracking parameter, which is the clean canonical
 * form of the owner's link.
 *
 * `facebook` — the owner supplied `https://www.facebook.com/share/1L7pFCXvWb/`.
 * Facebook refuses anonymous fetches, so that share shortcode could not be
 * resolved to its destination from here (HTTP 403 on the share URL and on the
 * Page URL alike — it is a bot block, not a missing page). The destination used
 * is the Page URL that the official store itself declares in its own Organization
 * `sameAs` data and whose public Page metadata identifies it as the same business:
 * "Mariyas Naturals, Alappuzha", the "Homemade 100 Percent Natural Haircare oil"
 * shop with ~20k followers. It is therefore the genuine Page, never an invented
 * username and never an unrelated page. The share link is kept below so a later
 * reviewer can re-attempt the resolution.
 */
export const social = Object.freeze({
  instagram: {
    label: 'Instagram',
    href: 'https://www.instagram.com/mariyas_herbal_hair_care_oil/',
    /** Exactly what the owner sent, kept for traceability (contains a tracker). */
    ownerSupplied:
      'https://www.instagram.com/mariyas_herbal_hair_care_oil?srtk=MWt3dzU5ZGpldzNnaw==',
    resolution:
      'Owner link carries a share-tracking parameter; the clean canonical profile URL is used instead. Same account.',
    verifiedOn: '2026-11-16',
    evidence: 'Profile opened directly; bio links to mariyasnaturals.com.',
  },
  facebook: {
    label: 'Facebook',
    href: 'https://www.facebook.com/mariayasnaturals/',
    /** Exactly what the owner sent, kept for traceability (unresolvable here). */
    ownerSupplied: 'https://www.facebook.com/share/1L7pFCXvWb/',
    resolution:
      'Share shortcode returns HTTP 403 to anonymous fetches, so its destination could not be read. The canonical Page URL used here is the one the official store declares in its Organization sameAs data and whose Page metadata matches this business (Mariyas Naturals, Alappuzha).',
    verifiedOn: '2026-11-16',
    evidence:
      "Declared in the official store's own Organization sameAs data; Page metadata (name, town, category) matches the business; page returns HTTP 403 to anonymous fetches.",
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
