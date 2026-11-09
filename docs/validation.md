# Foundation validation

Validated locally with Node 24.22.1 and npm 11.9.0. This report covers this starter implementation, not a VPS deployment or future production site.

| Check                                            | Actual result                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `npm install`                                    | Application and development dependencies installed; lockfile generated                                     |
| `npm run check`                                  | 0 errors, 0 warnings, 0 hints                                                                              |
| `npm run lint`                                   | Prettier check passed                                                                                      |
| `npm test`                                       | 3 policy tests passed                                                                                      |
| `npm run build`                                  | 5 static HTML pages plus robots and sitemap generated                                                      |
| `npm run test:static`                            | All four locales passed metadata, language links, fragment/route links, story structure and JSON-LD checks |
| Explicit future production build + static checks | Passed with `.in` canonicals, alternates and indexing enabled; safe development output restored afterwards |
| `npm run test:browser`                           | 7 Chromium tests passed                                                                                    |
| `npm audit`                                      | 0 known vulnerabilities reported at validation time                                                        |

Browser checks cover mobile overflow and navigation in all four languages, axe WCAG-tagged automated scans (zero violations in tested states), desktop navigation, keyboard skip link, reduced motion, content/language navigation without JavaScript, and a ScrollTrigger scene moving from its initial offset to rest. Desktop and mobile screenshots were generated and the English desktop design was visually inspected. A Malayalam mobile menu overflow issue found during testing was corrected and the tests rerun successfully.

Earlier validation also caught and corrected ambiguous module resolution between build configuration and browser/shared site configuration. Astro's agent background preview behavior was handled with `--ignore-lock` for the Playwright-managed server. Astro telemetry was disabled for validation because this sandbox cannot write its default home config directory.

No sensitive credentials were added. `.env` is ignored; `.env.example` contains only public configuration. All external application links use the supplied official store origin; no unverified product purchase link is emitted. Generated files and installed dependencies are ignored by Git.

Limitations: browser/axe checks are not a complete WCAG audit; no Core Web Vitals measurements or real-user performance guarantees are claimed. Native-speaker review, verified heritage/ingredient sources, approved logo/product assets and exact product purchase URLs remain future editorial inputs. No server, DNS, SSL, WordPress or production website was modified. CI is configured but a remote CI run is not asserted by this local report.
