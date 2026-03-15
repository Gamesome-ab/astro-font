---
"@gamesome/style-dictionary-font": minor
"@gamesome/astro-font": minor
"@gamesome/core-font": minor
---

Support CSS custom properties in `applyFontFamilyToSelector`. You can now pass an object with `selector` and/or `cssVariable` to expose the full generated font stack as a CSS variable on `:root`. When both are provided, the selector rule references the variable via `var()`. Existing `string | false` usage is unchanged.

```ts
applyFontFamilyToSelector: {
  selector: ".font-heading",
  cssVariable: "--font-heading",
}
```