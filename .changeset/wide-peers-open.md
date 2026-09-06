---
"@gamesome/style-dictionary-font": patch
---

Widen the `style-dictionary` peer dependency range to `^4.0.0 || ^5.0.0`. The format only relies on the v4 format hook signature, which is unchanged in v5, and the test suite passes against both majors. Fixes #18.
