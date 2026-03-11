---
"@gamesome/core-font": patch
"@gamesome/astro-font": patch
"@gamesome/style-dictionary-font": patch
---

Improve bold fallback scaling by using weight-specific Capsize metrics when they exist, and fail fast for unsupported custom `bold.weight` values instead of silently generating incorrect overrides.

Unsupported custom weights now produce a build error with clear remediation: provide `bold.scaling`, change the weight to `700`, or disable that bold fallback.