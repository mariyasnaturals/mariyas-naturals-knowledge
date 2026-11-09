# Reviewed educational content queue

The existing `EditorialPage` model supports botanical, hair-care, heritage and quality pages with sources, locale, reviewer state and optional verified review dates. No new educational article routes or efficacy claims are published in Task 03.

| Future topic / search intent         | Required evidence before publication                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Natural Ayurvedic hair oil in Kerala | Reviewed product classification and terminology; clearly attributed brand context; no unverified efficacy or certification claims           |
| Traditional hair-care ingredients    | Exact approved product ingredient list, botanical identity references, and separation between general education and specific product claims |
| Kerala Ayurvedic hair-care heritage  | Documented historical sources and brand-specific records; native-language editorial review; no unsupported age or lineage claim             |

Each brief should record its intended audience, reviewer, source URLs, access dates, approved claims, image provenance, and equivalent translated routes. Use semantic static HTML, one descriptive H1, unique metadata, source notes and contextual internal links. Add Article/Breadcrumb structured data only when the actual content and verified metadata warrant it. Publish hreflang only for real reviewed translations, preserve a deliberate x-default, and update the sitemap after approved routes exist. The `.cloud` build remains noindex.
