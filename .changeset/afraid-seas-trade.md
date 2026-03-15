---
"@gamesome/core-font": patch
"@gamesome/astro-font": patch
"@gamesome/style-dictionary-font": patch
---

Fix issue #10 (stray commas in output) by correcting how `@font-face` CSS is assembled when multiple font families are configured.
