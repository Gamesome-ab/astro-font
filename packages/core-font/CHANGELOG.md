# @gamesome/core-font

## 0.1.0

### Minor Changes

- 5314045: Support CSS custom properties in `applyFontFamilyToSelector`. You can now pass an object with `selector` and/or `cssVariable` to expose the full generated font stack as a CSS variable on `:root`. When both are provided, the selector rule references the variable via `var()`. Existing `string | false` usage is unchanged.

  ```ts
  applyFontFamilyToSelector: {
    selector: ".font-heading",
    cssVariable: "--font-heading",
  }
  ```

### Patch Changes

- 2095fe1: Fix issue #10 (stray commas in output) by correcting how `@font-face` CSS is assembled when multiple font families are configured.

## 0.0.2

### Patch Changes

- 9105d2d: Improve bold fallback scaling by using weight-specific Capsize metrics when they exist, and fail fast for unsupported custom `bold.weight` values instead of silently generating incorrect overrides.

  Unsupported custom weights now produce a build error with clear remediation: provide `bold.scaling`, change the weight to `700`, or disable that bold fallback.
