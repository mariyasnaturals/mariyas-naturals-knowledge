/**
 * The Ritual Finder scoring rules.
 *
 * Deliberately small and inspectable: every point comes from a table here, and
 * the same answer set always produces the same result. There is no randomness, no
 * model and no network call — it runs in the browser on imported data.
 *
 * Scoring, in order of weight:
 *   1. concern match          +4 per distinct concern the product covers
 *   2. category match         +3 when the product is in the chosen care group
 *   3. scalp-type alignment   +2 (oily-scalp products for an oily scalp, etc.)
 *   4. routine fit            +1 for a pack size that suits the stated frequency
 *
 * Nothing is expressed as a percentage, because the inputs are not measurable
 * quantities. The UI reports the ORDER and the REASONS, never a fake "97% match".
 */
import {
  fallbackProductIds,
  ritualProducts,
  type AnswerSet,
  type RitualProduct,
} from './ritual';

export interface Recommendation {
  product: RitualProduct;
  /** The concerns that earned this product its place, for the reason line. */
  matched: string[];
  /** True when the result came from the honest fallback rather than a match. */
  fallback: boolean;
}

/** Products whose character is "lighter / wash-focused", used for oily scalps. */
const LIGHT_WASH = new Set(['mn-19197', 'mn-19193']);

/** Conditioning-leaning products, used for dry scalps and dry-feeling hair. */
const CONDITIONING = new Set([
  'mn-in-3008',
  'mn-in-3009',
  'mn-19191',
  'mn-19195',
  'mn-19185',
]);

const SKIN_PRODUCTS = new Set([
  'mn-19224',
  'mn-19226',
  'mn-19517',
  'mn-19526',
  'mn-19525',
  'mn-19528',
]);

const HAIR_PRODUCTS = new Set(
  ritualProducts
    .filter((product) => product.category === 'hair')
    .map((product) => product.id),
);

/**
 * One family per formula. The 200 ml and 500 ml oils are the same product in two
 * sizes, so a result list must never offer both — it would read as two separate
 * recommendations. `familyOf` collapses them to the size that scored best.
 */
const familyOf = (product: RitualProduct): string =>
  product.id.startsWith('mn-in-300') ? 'hair-oil-edition' : product.id;

const score = (product: RitualProduct, answers: AnswerSet): number => {
  let total = 0;
  const concerns = [
    ...(answers.hairConcerns ?? []),
    ...(answers.skinFocus ?? []),
  ];

  // 1. Concerns.
  for (const concern of concerns)
    if (product.cares.includes(concern)) total += 4;

  // 2. Category.
  const wantsHair = answers.category === 'hair' || answers.category === 'both';
  const wantsSkin = answers.category === 'skin' || answers.category === 'both';
  if (wantsHair && HAIR_PRODUCTS.has(product.id)) total += 3;
  if (wantsSkin && SKIN_PRODUCTS.has(product.id)) total += 3;
  // "Both" should still not flood the result with wellness items.
  if (answers.category !== 'both' && product.category === 'wellness')
    total -= 6;
  if (answers.category === 'hair' && product.category === 'baby') total -= 4;
  if (answers.category === 'skin' && product.category === 'baby') total -= 4;

  // 3. Scalp alignment.
  if (answers.hairScalp === 'oily' && LIGHT_WASH.has(product.id)) total += 2;
  if (
    (answers.hairScalp === 'dry' || answers.hairScalp === 'flaky') &&
    CONDITIONING.has(product.id)
  )
    total += 2;
  if (answers.hairScalp === 'sensitive' && product.cares.includes('soothing'))
    total += 2;

  // 4. Routine fit: a frequent routine justifies the larger pack.
  if (answers.routine === 'daily' || answers.routine === 'twice') {
    if (product.id === 'mn-in-3009') total += 1;
    if (product.id === 'mn-19224') total += 1; // rose water is a daily refresh
  }
  if (answers.routine === 'weekly' || answers.routine === 'rare') {
    if (product.id === 'mn-in-3008') total += 1;
  }

  return total;
};

/** Stable ordering so two equally-good products never swap places between runs. */
const byStoreId = (a: RitualProduct, b: RitualProduct) =>
  a.storeProductId - b.storeProductId;

export function recommend(answers: AnswerSet): Recommendation[] {
  const scored = ritualProducts
    .map((product) => {
      const concerns = [
        ...(answers.hairConcerns ?? []),
        ...(answers.skinFocus ?? []),
      ];
      return {
        product,
        total: score(product, answers),
        matched: concerns.filter((concern) => product.cares.includes(concern)),
      };
    })
    .sort((a, b) => b.total - a.total || byStoreId(a.product, b.product));

  // Honest fallback: nothing scored above the category baseline, so we say so and
  // show two universally sensible basics instead of inventing a match.
  const best = scored[0];
  if (!best || best.total <= 3) {
    return fallbackProductIds
      .map((id) => ritualProducts.find((product) => product.id === id)!)
      .map((product) => ({
        product,
        matched: [] as string[],
        fallback: true,
      }));
  }

  // One to three products, and never two sizes of the same oil.
  const seen = new Set<string>();
  const results: Recommendation[] = [];
  const take = (entry: (typeof scored)[number]) => {
    const family = familyOf(entry.product);
    if (entry.total <= 2 || seen.has(family) || results.length === 3) return;
    seen.add(family);
    results.push({
      product: entry.product,
      matched: entry.matched,
      fallback: false,
    });
  };

  // When the visitor asked for both hair and skin, the answer is not honest if
  // every suggestion is hair oil. Reserve one slot per group they picked, then
  // fill the remaining slot with the best of the rest.
  if (answers.category === 'both') {
    const bestHair = scored.find((entry) =>
      HAIR_PRODUCTS.has(entry.product.id),
    );
    const bestSkin = scored.find((entry) =>
      SKIN_PRODUCTS.has(entry.product.id),
    );
    if (bestHair) take(bestHair);
    if (bestSkin) take(bestSkin);
  }
  for (const entry of scored) take(entry);

  if (!results.length)
    return fallbackProductIds
      .map((id) => ritualProducts.find((product) => product.id === id)!)
      .map((product) => ({
        product,
        matched: [] as string[],
        fallback: true,
      }));

  // Give every card a distinct lead reason: the first concern this product covers
  // that no earlier card has already claimed. Shared concerns stay listed, they
  // just cannot be the headline twice.
  const claimed = new Set<string>();
  return results.map((entry) => {
    const own = entry.matched.find((concern) => !claimed.has(concern));
    // No unique concern left? Fall back to a reason about the product's own
    // category rather than repeating the previous card's sentence.
    const lead = own ?? entry.product.category;
    claimed.add(lead);
    return {
      ...entry,
      matched: [lead, ...entry.matched.filter((concern) => concern !== lead)],
    };
  });
}

/**
 * The ordered question list for the chosen category. Kept in one place so the UI
 * and the tests agree on what "step 2 of 4" means.
 */
export type QuestionKey =
  | 'category'
  | 'hairScalp'
  | 'hairType'
  | 'hairConcerns'
  | 'routine'
  | 'skinType'
  | 'skinFocus'
  | 'age';

export function questionsFor(category?: AnswerSet['category']): QuestionKey[] {
  if (category === 'skin')
    return ['category', 'skinType', 'skinFocus', 'routine', 'age'];
  if (category === 'both')
    return [
      'category',
      'hairScalp',
      'hairConcerns',
      'skinType',
      'skinFocus',
      'routine',
      'age',
    ];
  return [
    'category',
    'hairScalp',
    'hairType',
    'hairConcerns',
    'routine',
    'age',
  ];
}
