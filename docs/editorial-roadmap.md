# Reviewed educational content queue

The existing `EditorialPage` model supports botanical, hair-care, heritage and quality pages with sources, locale, reviewer state and optional verified review dates. No new educational article routes or efficacy claims are published in Task 03.

| Future topic / search intent         | Required evidence before publication                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Natural Ayurvedic hair oil in Kerala | Reviewed product classification and terminology; clearly attributed brand context; no unverified efficacy or certification claims           |
| Traditional hair-care ingredients    | Exact approved product ingredient list, botanical identity references, and separation between general education and specific product claims |
| Kerala Ayurvedic hair-care heritage  | Documented historical sources and brand-specific records; native-language editorial review; no unsupported age or lineage claim             |

Each brief should record its intended audience, reviewer, source URLs, access dates, approved claims, image provenance, and equivalent translated routes. Use semantic static HTML, one descriptive H1, unique metadata, source notes and contextual internal links. Add Article/Breadcrumb structured data only when the actual content and verified metadata warrant it. Publish hreflang only for real reviewed translations, preserve a deliberate x-default, and update the sitemap after approved routes exist. The `.cloud` build remains noindex.

## Current discoverability plan

Localized product and collection routes cover Mariyas hair oil, hair care in Kerala, baby care, skincare and herbal wellness with actual catalogue names, source references, semantic headings and structured metadata. The homepage introduces Ayurvedic hair oil and natural care in Kerala. Current imagery is exclusively approved .in media.

Search intents such as “best natural hair oil in Kerala,” “100% natural” and “chemical free Ayurvedic products” require reviewed comparative criteria or substantiation before those words become product claims. An intent is not evidence. Any educational expansion should retain the existing review/source fields and the current .in-only visual policy. Staging remains noindex.
