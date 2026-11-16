/**
 * Customer reviews published on the homepage.
 *
 * These are the owner's own Google Business Profile reviews, supplied by the
 * owner as a screenshot of that listing and approved for publication here. They
 * are held in code, transcribed by hand, one record per review:
 *
 *   - **Verbatim.** Each `text` is the reviewer's original wording, character for
 *     character, including its own spelling and punctuation. Nothing is tidied,
 *     trimmed, capitalised or extended, and no quote marks are added around it:
 *     the card is a `<blockquote>`, which is what marks it as a quotation.
 *   - **Attributed.** The reviewer's name exactly as Google displays it, the star
 *     rating they gave, and a link back to the profile they wrote on.
 *   - **No invention.** There are no reviewer photographs, no review dates, no
 *     "6 days ago" relative timestamps, no reviewer counts and no extra praise.
 *     A reading of the listing's aggregate lives in `site-contact.ts`, not here.
 *   - **Opinion, not finding.** Each card is labelled as a customer opinion from
 *     Google Reviews. Nothing here is presented as a product claim, clinical
 *     result or medical outcome, and one reviewer's wording ("No chemicals") is
 *     that reviewer's opinion — it is not restated anywhere as a brand claim.
 *
 * No Google script, widget, API client or scraper is involved: this file is the
 * complete list, and it changes only when the owner supplies and approves a
 * different review. The live listing stays the source of truth and is linked from
 * the aggregate block above the carousel.
 *
 * Compliance note (reported to the owner, kept here so it cannot be lost):
 * Google's own guidance for businesses says user reviews belong to the person who
 * wrote them and that reviewer consent is required to use them for marketing,
 * such as on a website. The owner has approved publication of these three; the
 * mitigations in place are verbatim text, full attribution, a link back to the
 * source, an explicit "customer opinion" label, no medical or brand-claim reuse,
 * and no review or aggregate-rating structured data (so no star snippets are
 * solicited from them). If a reviewer withdraws consent, delete that record here
 * and the card disappears from all five locales on the next build.
 *
 * See docs/customer-voices.md.
 */
import { googleBusiness } from './site-contact';

export interface CustomerReview {
  /** Stable key, used for tests and for ordering. */
  readonly id: string;
  /** Reviewer name exactly as the Google profile displays it. */
  readonly author: string;
  /** The star rating the reviewer gave, as shown on the profile. */
  readonly rating: 1 | 2 | 3 | 4 | 5;
  /** The review text, verbatim. English: never translated or paraphrased. */
  readonly text: string;
  /** Where the words were published; always the Google listing. */
  readonly source: 'Google Review';
}

export const customerReviews: readonly CustomerReview[] = Object.freeze([
  {
    id: 'pramod-kumar-ms',
    author: 'Pramod Kumar .M.S',
    rating: 5,
    text: 'I am their regular customer and its hair oil really helps to reduce my hairfall and helps to strengthen my hair and improve hair growth. I really recommend this product.',
    source: 'Google Review',
  },
  {
    id: 'abacus-world-academy',
    author: 'Abacus World Academy',
    rating: 5,
    text: 'Excellent hair oil for hair growth, must try this',
    source: 'Google Review',
  },
  {
    id: 'jincy-siju',
    author: 'Jincy Siju',
    rating: 5,
    text: 'No chemicals very good experience i am happy',
    source: 'Google Review',
  },
]);

/**
 * How these three came to be published. Recorded so a later reviewer can re-check
 * the same facts the owner supplied, and so the aggregate rating can never be
 * confused with the individual reviews.
 */
export const reviewsProvenance = Object.freeze({
  /** The listing the words were written on, and the link each card points back to. */
  profileUrl: googleBusiness.href,
  /** Who approved publication, and when. */
  ownerApprovedOn: '2026-11-16',
  /** Where the text came from: the owner's screenshot of the listing itself. */
  suppliedAs:
    'Owner-supplied screenshot of the Mariyas Naturals Google listing',
  /** Why the words are exactly as they are. */
  handling:
    'Transcribed verbatim by hand; no widget, API client, scraper or automatic sync',
  /** The aggregate shown above the carousel is a dated reading, not a live value. */
  aggregateReviewedOn: googleBusiness.ratingReviewedOn,
  /** Consent position, as reported to the owner (see the file header). */
  consentNote:
    'Google states that a review belongs to its reviewer and that consent is needed to use it in marketing; publication here rests on the owner-supplied approval, with verbatim text and full attribution.',
});
