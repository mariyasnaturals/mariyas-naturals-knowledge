# Chat with Mariyas — the care assistant

A product guide that sits on every page. It is deliberately **not** a chatbot and
**not** a clinician.

## What it does

- Finds a product in the 85-listing official catalogue from a name, a category or
  a concern typed in any of the five interface languages.
- Reports the **official pack size, price, availability and the listing's own
  description** for that product.
- Points to the official listing for anything it cannot quote.
- Refuses to answer medical questions and sends the visitor to a qualified
  practitioner.

## What it never does

| Risk | How it is prevented |
| --- | --- |
| Invented ingredients, prices or claims | Every string comes from `catalogue/care-knowledge.json`, a verbatim snapshot of the public WooCommerce Store API taken on the verification date. There is no model, no prompt and no generation step. |
| Network calls or tracking | The assistant never calls the network. The catalogue index ships with the site. `tests/browser/home.spec.ts` aborts every non-`127.0.0.1` request and asserts none were attempted. |
| Medical advice | `detectIntents` escalates pregnancy, breastfeeding, allergy, infant, medicine, doctor and "is it safe" phrasing to the caution answer. |
| Wrong product photo | Answers only show a photograph whose media record is associated with that exact listing (`tests/care-assistant.test.mjs`). |
| A dead button without JavaScript | The trigger is rendered `hidden` and is revealed by the module script. |

## Data

`catalogue/care-knowledge.json` is produced by `scripts/sync-com-catalogue.mjs`:

```js
{
  id, slug, name, category, packSize, storeUrl, inStock,
  prices: { currencyCode, minorUnit, price, regular, sale, onSale },
  mediaId, categories[], attributes[], summary, details, keywords[]
}
```

`summary` and `details` are the store's own `short_description` and `description`
with HTML removed and entities decoded — nothing is rewritten. Prices stay in the
store's minor units and are formatted in the browser, so no rounding or
currency guess is introduced. `verifiedOn` is included in the file.

## Cost of downloading it

The index is a build-time module (`src/data/care-index.ts`), not a `public/` file:

- it is emitted by Vite as its own chunk (`care-index.<hash>.js`, ≈34 KB gzip);
- it is fetched with `import()` the **first time** the panel opens;
- a visitor who never opens the assistant downloads none of it.

`tests/browser/catalogue.spec.ts` and `package-pr-preview.mjs` continue to see a
clean `public/` and `dist/` allowlist.

## Placement and accessibility

- Bottom-left on every viewport: the gold shop pill owns bottom-right, the hero's
  video control is absolute bottom-right, and the mobile bar owns the strip below
  both. `tests/browser/home.spec.ts` measures the boxes at 390 px and asserts the
  trigger overlaps none of them.
- The panel is a native `<dialog>` opened with `showModal()`, so the browser
  provides the focus trap, the inert background, `Escape` and focus restoration.
  The test presses `Escape` and asserts focus returns to the trigger.
- Every control is at least 34–44 px, the answers are announced through
  `role="log"` with `aria-live="polite"`, and `axe` runs WCAG 2.2 AA on the open
  panel in all five locales.

## Limitations the owner should know

1. Product names, prices and descriptions are quoted in **English** — they are the
   store's own wording. The assistant's own sentences are localised in en / ml /
   hi / ta / kn; those need native editorial review like the rest of the
   translated copy.
2. The assistant knows the 85 published listings. It does not know stock levels
   beyond the snapshot flag, delivery times, or whether a batch is in transit.
3. Price and stock are a snapshot. `verifiedOn` in
   `catalogue/care-knowledge.json` is the date the store was read; the listing is
   always the authority.
