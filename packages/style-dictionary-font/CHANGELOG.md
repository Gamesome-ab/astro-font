# @gamesome/style-dictionary-font

## 0.1.1

### Patch Changes

- 6eaf12f: Support tokens in the DTCG format (`$value` / `$type`). Previously only the legacy `value` key was read, so DTCG token files produced an empty `fonts.css` and `preloads.json` with no error. Fixes #17.
- 0cedbd2: Widen the `style-dictionary` peer dependency range to `^4.0.0 || ^5.0.0`. The format only relies on the v4 format hook signature, which is unchanged in v5, and the test suite passes against both majors. Fixes #18.

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
