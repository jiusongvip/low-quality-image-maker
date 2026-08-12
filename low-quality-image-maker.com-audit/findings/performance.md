 # Performance Findings: low-quality-image-maker.com

 **Score: 55/100**

 ## What Works
 - CSS inlined (26 KB, no render-blocking external stylesheets)
 - JS modules deferred (type="module", non-blocking)
 - Demo images use `loading="lazy"`
 - System font stack (no font downloads)
 - Zero third-party scripts, analytics, or trackers

 ## Issues

 **s|High| Total page weight ~1,381 KB (1.35 MB)**
 Images contribute ~87% of total: 8 demo PNGs at ~1,203 KB. HTML is 114 KB. Slow LCP on mobile.

 **s|High| 3 oversized PNGs: 1.1 MB wasted**
 `meme-deepfried-degraded.png` (409 KB), `gradient-vintage-degraded.png` (403 KB), `photo-crt-degraded.png` (292 KB). JPEGs for same images exist at 21, 16, 14 KB. PNG should only be used for pixel art and privacy masking outputs, not degraded demo images.

 **s|Medium| No image dimensions → CLS**
 All 10 `<img>` tags lack `width`/`height` attributes. Guarantees layout shift on load.

 **s|Medium| No resource hints**
 No preload, prefetch, or preconnect tags.

 **s|Low| HTML is 114 KB**
 Large for a single page. Splitting guide content to sub-pages would help.
