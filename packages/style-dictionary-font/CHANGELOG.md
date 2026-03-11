# @gamesome/style-dictionary-font

## 0.0.2

### Patch Changes

- 9105d2d: Improve bold fallback scaling by using weight-specific Capsize metrics when they exist, and fail fast for unsupported custom `bold.weight` values instead of silently generating incorrect overrides.

  Unsupported custom weights now produce a build error with clear remediation: provide `bold.scaling`, change the weight to `700`, or disable that bold fallback.

- Updated dependencies [9105d2d]
  - @gamesome/core-font@0.0.2
