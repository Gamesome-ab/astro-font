# @gamesome/core-font

Core font optimization logic shared by [`@gamesome/astro-font`](../astro-font) and [`@gamesome/style-dictionary-font`](../style-dictionary-font). This package generates `@font-face` CSS with scaled fallback fonts to reduce [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls).

You probably don't need to use this package directly — use one of the framework-specific packages above instead. This README documents the approach, algorithm, and known limitations.

## How fallback scaling works

When a web font loads, the browser swaps it in for the fallback font. Because web fonts and system fonts have different metrics (character widths, ascenders, descenders), this swap causes text to reflow. The goal is to make the fallback font match the web font's dimensions as closely as possible, so the swap is invisible.

We use [Capsize](https://seek-oss.github.io/capsize/) to calculate CSS override values for each fallback font. This is the same approach used by [`@next/font`](https://vercel.com/blog/nextjs-next-font) and [`fontaine`](https://github.com/unjs/fontaine). The key CSS descriptors are:

- **`size-adjust`** — scales all glyph metrics by a percentage, making the fallback font wider or narrower to match the web font's average character width
- **`ascent-override`** — adjusts the space above the baseline
- **`descent-override`** — adjusts the space below the baseline
- **`line-gap-override`** — adjusts the extra space between lines

### The algorithm

For regular weight, we delegate to Capsize's `createFontStack()` which computes override values based on per-font metrics from [`@capsizecss/metrics`](https://www.npmjs.com/package/@capsizecss/metrics). The core calculation is:

1. Compute the average character width ratio: `(webFont.xWidthAvg / webFont.unitsPerEm) / (fallback.xWidthAvg / fallback.unitsPerEm)` — this becomes `size-adjust`
2. Recompute vertical metrics against the size-adjusted em square — these become `ascent-override`, `descent-override`, and `line-gap-override`
3. Only emit overrides that differ from the fallback font's native values

## Bold fallback calculation

Bold text is wider than regular text, and different fonts grow at different rates when bolded. Without weight-specific overrides, a fallback `@font-face` that looks good at regular weight can be significantly off at bold.

Capsize's `createFontStack()` only generates a single set of overrides (for regular weight) and doesn't export its internal `calculateOverrideValues` function. We replicate that calculation using weight-specific variant metrics from Capsize's metrics collection when that exact weight exists (for example `variants["700"]` for bold), which include `xWidthAvg`, `ascent`, `descent`, `lineGap`, and `unitsPerEm` for that cut of each font.

The bold fallback `@font-face` block uses the same `font-family` name as the regular fallback and adds the configured `font-weight`, so the browser selects the right override set automatically.

### Why bold fallbacks matter

Browsers don't reliably synthesize bold for fallback fonts ([source](https://www.smashingmagazine.com/2013/02/setting-weights-and-styles-at-font-face-declaration/#problem-if-the-fallback-font-loads-weights-and-styles-will-be-lost)). Without a bold `@font-face` declaration using `local('Helvetica Bold')` or similar, bold text in the fallback font may render at regular weight — causing a large reflow when the web font loads and the text suddenly becomes wider.

### User overrides

If the automatic bold calculation doesn't produce good results for a specific font pairing, you can override individual values via the `bold.scaling` property on fallback fonts. These values take precedence over the calculated ones. See the `FallbackFont` configuration in your framework package's README.
If you set a custom `bold.weight`, automatic calculation only works when Capsize exposes metrics for that exact weight. Otherwise we throw a build error that tells you to use `bold.scaling`, change the weight to `700`, or disable the bold fallback.

## Limitations

### `size-adjust` scales uniformly

The CSS `size-adjust` descriptor scales **both width and height** by the same factor. There is no CSS mechanism to scale them independently. This was explicitly discussed in [CSSWG Issue #6075](https://github.com/w3c/csswg-drafts/issues/6075) — independent horizontal/vertical scaling was deferred as a future enhancement and has not been revisited.

In practice, this means `size-adjust` optimizes for horizontal line-length matching (via `xWidthAvg`), and then the vertical override descriptors (`ascent-override`, `descent-override`, `line-gap-override`) correct the vertical metrics back to their proper values. This two-step approach — scale for width, then fix height — works well in most cases.

### Mismatched bold growth rates

Some font pairings have very different bold growth rates. For example:

- **Lora Bold** is only ~3% wider than Lora Regular
- **Georgia Bold** is ~16% wider than Georgia Regular

When the web font barely grows when bolded but the system fallback grows significantly (or vice versa), the bold `size-adjust` will differ substantially from the regular one. Because `size-adjust` affects both dimensions, scaling Georgia Bold down to match Lora Bold's width also shrinks its height — causing visible vertical misalignment.

This is a fundamental limitation of the current CSS specification, not a bug in the calculation. The same limitation applies to every tool that uses `size-adjust` for fallback matching, including [Capsize](https://github.com/seek-oss/capsize), [Next.js](https://nextjs.org/docs/pages/api-reference/components/font), and [Fontaine](https://github.com/unjs/fontaine).

**What you can do:**

- **Accept it for most pairings.** Sans-serif fonts (Rubik/Helvetica, DM Sans/Arial, etc.) tend to have similar bold growth rates and produce good results automatically.
- **Use `bold.scaling` to fine-tune.** For problematic serif pairings, manually set override values that balance width and height to your preference.
- **Disable bold fallback for specific fonts.** Set `bold: false` on a fallback font to skip the bold `@font-face` declaration entirely. The browser will synthesize bold from the regular fallback (which may or may not look acceptable).

### Variable fonts and bold metrics

For variable fonts (e.g. "Lora Variable"), Capsize's `variants["700"]` metrics come from the static bold cut of the same family (e.g. the separate "Lora Bold" font file). These metrics are a close approximation of the variable font at `wght=700` — they share the same design masters — but not an exact match. This is the best data available, as variable font metrics at arbitrary weight values aren't exposed to CSS tooling.

## Comparison with other tools

| Feature                      | @gamesome/core-font  | Capsize                 | Next.js (`next/font`)              | Fontaine                                                      |
| ---------------------------- | -------------------- | ----------------------- | ---------------------------------- | ------------------------------------------------------------- |
| Regular weight fallbacks     | Yes (via Capsize)    | Yes                     | Yes                                | Yes                                                           |
| Per-weight bold fallbacks    | Yes                  | No (single weight only) | No                                 | Yes (since [#264](https://github.com/unjs/fontaine/pull/264)) |
| Manual override escape hatch | Yes (`bold.scaling`) | N/A                     | No                                 | No                                                            |
| Multiple fallback fonts      | Yes                  | Yes                     | No (Arial or Times New Roman only) | No                                                            |

## Tools

- [Perfect-ish Font Fallback](https://www.industrialempathy.com/perfect-ish-font-fallback/) — visually compare a web font against system fallbacks and preview override values. Useful for choosing which fallback font pairs best with your web font.
- [Font overlay bookmarklet](https://lucaslarson.github.io/fallback/) — overlay a different font on your live page to compare
- [Font style matcher](https://meowni.ca/font-style-matcher/) — visually compare two fonts side by side

## Further reading

- [Chrome: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks) — explains the problem and the `@font-face` override approach
- [web.dev: CSS size-adjust](https://web.dev/articles/css-size-adjust) — overview of the `size-adjust` descriptor
- [MDN: @font-face/size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) — specification reference
- [Capsize](https://seek-oss.github.io/capsize/) — the metrics library powering the calculations
- [CSSWG Issue #6075](https://github.com/w3c/csswg-drafts/issues/6075) — the proposal that became `size-adjust`, including discussion of independent axis scaling

## License

MIT
