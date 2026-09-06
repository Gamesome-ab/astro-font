---
"@gamesome/style-dictionary-font": patch
---

Support tokens in the DTCG format (`$value` / `$type`). Previously only the legacy `value` key was read, so DTCG token files produced an empty `fonts.css` and `preloads.json` with no error. Fixes #17.
