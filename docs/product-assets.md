# Authentic product media: acquisition and coverage

## Observed access result

Task 02 attempted public HTTPS requests to `https://mariyasnaturals.in/` (primary source) and `https://www.mariyasnaturals.com/` (secondary reference). Both failed with `CONNECT tunnel failed, response 403`, from the cloud egress proxy before either store could be inspected. This does **not** establish that the websites are down or that WordPress requires authentication. No login, API bypass, direct-origin request or private-system access was attempted. Repeating WordPress endpoint requests behind the same denied origin would not establish anything further.

The current environment network policy has no custom allowed hosts. Configuration draft reads failed twice with “current environment draft could not be verified”; no network settings were changed or saved. To resume discovery, allow outbound HTTPS to `mariyasnaturals.in` and `www.mariyasnaturals.com` in cloud environment settings. Add redirected or image-host domains only after their actual destinations are identified and reviewed. This is cloud development access, not a change to WordPress, DNS, SSL or the VPS.

## Coverage (actual, not estimated)

| Item                                                 |                          Count |
| ---------------------------------------------------- | -----------------------------: |
| Source-discovered product entries                    |                              0 |
| Source-verified products / SKUs / sizes              |                              0 |
| Source image URLs found                              |                              0 |
| Authentic images downloaded                          |                              0 |
| Images optimized / deduplicated / integrated         |                              0 |
| User-supplied product references waiting for imagery |           1 (Mariyas Hair Oil) |
| Total actual catalogue size                          |                        Unknown |
| Missing main/gallery/combo/variant asset count       | Unknown until catalogue access |

The existing clearly marked catalogue example remains demonstration data. It is not counted as an imported product. No original product photograph, packaging silhouette or substitute AI product image was generated. Botanical line art and abstract light layers are decorative and do not assert specific ingredients or manufacturing steps.

`src/data/media-manifest.json` records the blocked acquisition, counts and supplied reference. `src/data/media-types.ts` defines required provenance for each future asset: stable product ID/SKU, original website/media URL or export reference, original filename, dimensions, source hash, category, variant association, local derivative path, localized alt text and verification status. Empty media lists mean no media was acquired; invented source records are not used to fill the schema.

## Approved export alternative

If public access remains unavailable, supply a separately approved product/media export through the project file workflow. Minimum content:

- Product CSV/JSON: authoritative product ID, SKU when present, exact name, categories, package sizes/variants, and which media IDs belong to each product/variant.
- Main, gallery and combo-kit media files, with original filenames and their original source URLs or an export reference; include original dimensions and existing alt text where available.
- Approval/verification status and any permitted descriptions. Do not include customer records, orders, passwords, application tokens or database dumps.

No authenticated WordPress integration is required for a supplied export. If one later becomes necessary, authorize it as a separate read-only product/media integration with least-privilege access; enter credentials through secure settings, never chat.

## Import procedure after access or export

1. Enumerate the full public catalogue, pagination, variable products and gallery associations. Record IDs/SKUs and sizes; never infer one size from another bottle. The older `.com` packaging is secondary evidence only.
2. Download original approved files to a working directory outside Git. Preserve source URL/export ID and SHA-256. Deduplicate exact bytes while retaining every product/variant association.
3. Generate non-upscaled WebP/AVIF derivatives in `public/images/products/{product-slug}/`; preserve aspect ratio, labels, colour and product proportions. Keep original source files outside Git when large. Use managed object storage for a large source library, and retain provenance references. Do not sharpen, regenerate or alter printed labels.
4. Populate manifest records and the typed `Product.images.main/gallery`. Supply actual pixel dimensions, truthful localized alt text and width variants. `ProductVisual` renders local `srcset`, `sizes`, explicit dimensions, eager/high priority for the hero, and lazy loading below the fold. Galleries use native horizontal scroll snap. Do not hotlink WordPress images.
5. Verify every visual association against its source before setting `verified`. Update counts and list omissions explicitly. Run static/browser checks with actual assets, including image loading, responsive variants and the hero LCP. Current placeholder tests do not establish real-product image quality or performance.

For the hero and story, select the authoritative Hair Oil record only after its name, size and main photograph are verified. Never rename another product image to imply the example filename or volume.
