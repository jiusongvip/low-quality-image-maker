 # SEO Action Plan: low-quality-image-maker.com

 **Health Score: 58/100** | **2026-08-12**

 ---

 ## Phase 1: Critical Fixes (Week 1)

 These issues directly harm crawlability, indexability, or user experience. Fix immediately.

 | # | Action | Impact | Effort |
 |---|--------|--------|--------|
 | 1 | **Fix `theme-color` meta tag** — Change from OG image URL to `#18181b` in `src/layouts/BaseLayout.astro` | Prevents browser UI rendering glitch | 1 min |
 | 2 | **Replace 3 oversized PNGs with JPEGs** — Swap `meme-deepfried-degraded.png` (409KB), `gradient-vintage-degraded.png` (403KB), `photo-crt-degraded.png` (292KB) with their JPEG equivalents in `/public/img/` | Saves 1.1 MB (80% LCP reduction for image-heavy section) | 5 min |
 | 3 | **Pre-render gallery comparison images** — Replace JS-generated gallery with static `<img>` tags in HTML, matching the existing 4 "Visual Demo Gallery" pairs | Makes comparison content indexable; 5 pairs go from invisible to crawlable | 30 min |
 | 4 | **Add `width` and `height` to all `<img>` tags** — Every `<img>` in the template should declare pixel dimensions to prevent layout shift | Eliminates CLS from all image loads | 15 min |
 | 5 | **Create a privacy policy page** — `/privacy/` with clear statement about client-side processing, no data collection, no cookies. Link from footer. | Builds trust signals; reduces legal exposure | 1 hour |

 ---

 ## Phase 2: High-Impact Improvements (Weeks 2-3)

 These improve rankings, user trust, and content breadth.

 | # | Action | Impact | Effort |
 |---|--------|--------|--------|
 | 6 | **Build 3 sub-tool pages** (as planned in 建站方案）:
   - `/deep-fried-meme-maker/` — targeted deep fried tool + guide
   - `/compress-image/` — compression-focused tool + Discord/government form guides
   - `/pixelate-image/` — pixelation-only tool + privacy use cases | Triples keyword coverage; adds internal linking depth | 3 days |
 | 7 | **Launch blog with 3 seed posts:**
   - `/blog/what-is-deep-fried-meme/`
   - `/blog/how-to-compress-image-for-discord/`
   - `/blog/reduce-image-size-for-government-forms/` | Establishes topical authority; targets long-tail informational queries | 2 days |
 | 8 | **Add WebP versions of all demo images** — Create `.webp` copies and add `<picture>` / `srcset` markup | ~40% image payload reduction for Chrome/Firefox users | 1 hour |
 | 9 | **Create About page** — `/about/` with organizational attribution, tool mission, and contact info. Link from footer. | Strengthens E-E-A-T; addresses "who made this" gap | 1 hour |
 | 10 | **Add FAQPage structured data** — Ensure the 10-item FAQ section has correct JSON-LD FAQPage schema with `mainEntity` array | Enables FAQ rich results in SERPs | 30 min |

 ---

 ## Phase 3: Content & Authority (Month 2)

 | # | Action | Impact | Effort |
 |---|--------|--------|--------|
 | 11 | **Create image sitemap** — `sitemap-images.xml` listing all static images with `<image:image>` entries | Enables image search indexing for demo comparisons | 30 min |
 | 12 | **Add 2 more blog posts:**
   - `/blog/low-quality-image-aesthetic-history/`
   - `/blog/best-low-quality-image-maker-tools/` (competitor comparison — own the category) | Expands informational keyword footprint | 1 day |
 | 13 | **Create `llms.txt`** at root with tool description and links to key pages | Improves AI citation readiness | 15 min |
 | 14 | **Submit to tool directories** — Product Hunt, AlternativeTo, Toolify, There's An AI For That | Builds backlinks and brand signals | 2 hours |
 | 15 | **Add external citations** — Link to Reddit r/DeepFriedMemes, relevant Wikipedia articles (JPEG, digital artifact), and authoritative references from the guide sections | Strengthens E-E-A-T through outbound authority links | 30 min |
 | 16 | **Add security headers** — Create `public/_headers` with `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | Improves technical SEO; prevents clickjacking | 15 min |

 ---

 ## Phase 4: Monitoring & Iteration (Ongoing)

 | # | Action | Impact | Effort |
 |---|--------|--------|--------|
 | 17 | **Deploy to Cloudflare Pages + submit to GSC** — Submit sitemap.xml, request indexing | Baseline search visibility | 30 min |
 | 18 | **Set up GA4 + GSC monitoring** — Track organic impressions, clicks, CTR, average position | Data-driven iteration | 1 hour |
 | 19 | **Monitor Core Web Vitals** via CrUX once traffic qualifies (28-day rolling window) | Real-user performance data | Ongoing |
 | 20 | **Expand sub-pages for long-tail keywords** — Follow the 建站方案 keyword expansion list (e.g., "make image look bad online", "CRT monitor effect on image") | Broaden topical coverage over time | Ongoing |
 | 21 | **Build a custom 404 page** — `/404.html` with navigation back to the tool | Retain users who hit dead links | 30 min |

 ---

 ## Scoring Projection After Phase 1+2

 | Category | Current | Projected | Gain |
 |----------|---------|-----------|------|
 | Technical SEO | 65 | 78 | +13 |
 | Content Quality (E-E-A-T) | 58 | 72 | +14 |
 | On-Page SEO | 68 | 80 | +12 |
 | Schema | 65 | 78 | +13 |
 | Performance | 55 | 72 | +17 |
 | Images | 40 | 70 | +30 |
 | AI Readiness | 25 | 55 | +30 |
 | **TOTAL** | **58** | **~73** | **+15** |

 ---

 *Action plan generated 2026-08-12 based on full audit findings.*
