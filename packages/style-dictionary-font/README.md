# @gamesome/style-dictionary-font

A [Style Dictionary](https://amzn.github.io/style-dictionary/) v4 formatter for generating optimized `@font-face` CSS with scaled fallback fonts to reduce [CLS](https://web.dev/articles/cls).

Works with [Fontsource](https://fontsource.org/) variable fonts. Fallback fonts are automatically scaled using [Capsize](https://seek-oss.github.io/capsize/) — the same algorithm used by `@next/font` (further reading [here](https://vercel.com/blog/nextjs-next-font)).

## Why?

When a web font loads, the browser swaps it in for the fallback font. Because web fonts and system fonts have different metrics (character widths, line heights), this swap causes text to reflow — a major source of Cumulative Layout Shift (CLS).

This package solves that by:

- **Hosting fonts on your own domain** alongside your other assets, which is also better for [privacy / GDPR](https://www.cookieyes.com/documentation/features/integrations/google-fonts-and-gdpr/)
- **Generating scaled fallback `@font-face` declarations** so the fallback font matches the dimensions of your web font, eliminating reflow
- **Appending a system font stack** (similar to Tailwind's defaults) so glyphs, emojis, and symbols always render

## Installation

```bash
npm install @gamesome/style-dictionary-font
```

You also need to install your fonts from [Fontsource](https://fontsource.org/). We recommend variable fonts — they let you use a single font file for all weights.

```bash
npm install @fontsource-variable/rubik
```

## Getting started

### 1. Define your font tokens

Create a token file with `$extensions["gamesome.font"]` on your font family tokens:

```json
{
  "font": {
    "family": {
      "primary": {
        "value": "Rubik Variable",
        "type": "fontFamily",
        "$extensions": {
          "gamesome.font": {
            "fontType": "sans-serif",
            "imports": ["@fontsource-variable/rubik/wght.css"]
          }
        }
      }
    }
  }
}
```

#### Finding the right import paths

To find which CSS files to import:

1. Go to `node_modules/@fontsource-variable/<your-font>/` (or `@fontsource/` for static fonts)
2. Look at `index.css` to understand the font structure
3. You'll typically want `wght.css` for weights. For italics, look for `wght-italic.css` or `slnt.css`
4. If you don't include all styles (italic, slanted, etc.) the browser will synthesize "faux" versions which look worse

#### Finding the font family name

The `value` in your token must match the `font-family` in the fontsource CSS. Open one of the CSS files and look for:

```css
@font-face {
  font-family: "Rubik Variable";
  /* ... */
}
```

For variable fonts, Fontsource appends ` Variable` to the name (e.g. "Rubik" becomes "Rubik Variable").

### 2. Create a build script

Create a `build-tokens.mjs` file and wire it into your package scripts:

```json
{
  "scripts": {
    "tokens": "node build-tokens.mjs",
    "dev": "npm run tokens && vite",
    "build": "npm run tokens && vite build"
  }
}
```

```js
// build-tokens.mjs
import StyleDictionary from "style-dictionary";
import { gamesomeFontFaceFormat } from "@gamesome/style-dictionary-font";

StyleDictionary.registerFormat(gamesomeFontFaceFormat);

const sd = new StyleDictionary({
  source: ["src/tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/tokens/generated/",
      files: [{
        destination: "fonts.css",
        format: "gamesome/font-face-css",
      }],
    },
  },
});

await sd.buildAllPlatforms();
```

The formatter automatically:
- Resolves CSS imports from `node_modules` based on the `imports` in your token extensions
- Generates `@font-face` rules with `url()` paths using the fontsource package path (e.g. `url(@fontsource-variable/rubik/files/...)`) — your bundler (Vite, etc.) resolves these automatically
- Writes a `preloads.json` manifest alongside the CSS output (in the same `buildPath`) so you can add `<link rel="preload">` tags for faster font loading — see [Preloading fonts](#preloading-fonts)

### 3. Import the generated CSS

```js
import "./tokens/generated/fonts.css";
```

The generated CSS includes:
- A selector rule with the full font stack (primary + scaled fallbacks + system fonts)
- `@font-face` declarations for the primary font (from fontsource)
- `@font-face` declarations for each scaled fallback font

### 4. Verify it works

Start your project and check that fonts are applied. In Chrome DevTools, inspect an element's computed styles to see which font is being rendered (see [this guide](https://stackoverflow.com/questions/18900720/where-to-see-font-files-loaded-by-chrome-in-the-inspector)). The first font family is applied to the `html` element by default.

## Token extension properties

Properties available on `$extensions["gamesome.font"]`:

### `fontType`

Type: `"sans-serif" | "serif" | "mono"`

The type of font. This determines which default [fallback fonts](#fallbacks) and [system font stack](#appendfontfamilies) are used.

If not specified, defaults to `"sans-serif"`.

### `imports`

Type: `string[]`

CSS import paths from fontsource. Each path should be the same as you'd use in a JavaScript import statement (e.g. `"@fontsource-variable/rubik/wght.css"`). The fonts must be installed in your project's `node_modules`.

See [Finding the right import paths](#finding-the-right-import-paths) for help.

### `staticFontName`

Type: `string` (optional)

The name of the static (non-variable) version of the font, used for Capsize metric lookup. Usually this is the font name without the " Variable" suffix — e.g. for "Rubik Variable" the static name is "Rubik".

If not set, the package will guess by removing " Variable" from the name. You only need this if your font has an unusual naming convention.

You can find all fonts available for Capsize calculation [here](https://github.com/seek-oss/capsize/blob/master/packages/metrics/scripts/googleFonts.json).

### `fallbacks`

Type: `string[] | false` (optional)

A list of system fonts to use as fallback while the web font loads. These fallback fonts get scaled `@font-face` declarations so they match the dimensions of your primary font, reducing CLS.

If not set, defaults are chosen based on `fontType`:

- **sans-serif:** Helvetica, "Helvetica Neue", Arial
- **serif:** Georgia, "Times New Roman"
- **mono:** Menlo, Monaco, "Courier New"

Set to `false` to disable fallback fonts entirely. You might do this if you preload all your font files and don't care about the flash of unstyled text.

Each fallback font also gets a **bold variant** (e.g. "Arial Bold" at weight 700) with its own weight-specific override values calculated from Capsize's variant metrics when that exact weight exists in Capsize's data. This is important because bold text is wider than regular text — without a scaled bold fallback, bold sections will reflow when the web font loads, causing CLS. Faux bold on fallback fonts does not work reliably across browsers.

If you configure a custom bold weight that Capsize does not expose metrics for, the build will fail with instructions to use `bold.scaling`, change the weight to `700`, or disable that bold fallback.

For some font pairings (especially serif fonts), the automatic bold calculation may produce visible misalignment due to inherent limitations of the CSS `size-adjust` descriptor. See [Limitations in @gamesome/core-font](../core-font/README.md#limitations) for details and workarounds.

### `appendFontFamilies`

Type: `string | false` (optional)

A system font stack appended after your primary and fallback fonts in the `font-family` declaration. This ensures that glyphs, emojis, and symbols always render — even if they aren't covered by your chosen font.

The defaults match [Tailwind's font stacks](https://tailwindcss.com/docs/font-family):

- **sans-serif:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
- **serif:** `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`
- **mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

Pass a custom string to override, or `false` to disable entirely.

### `applyFontFamilyToSelector`

Type: `string | false | { selector?: string | false; cssVariable?: string }` (optional)

A CSS selector where the generated `font-family` will be applied, and/or a CSS custom property that will be defined on `:root` with the full generated font stack. The first font family is applied to `html` by default. The second and subsequent families **must** specify `applyFontFamilyToSelector`, but that can now be either a selector string or an object with a `cssVariable`.

Set to `false` if you apply font families elsewhere (e.g. in your Tailwind config or custom CSS).

**Examples:**

- `".font-serif"`
- `{ "cssVariable": "--font-serif" }`
- `{ "selector": ".font-serif", "cssVariable": "--font-serif" }`

## Adding multiple fonts

Add more font families to your token file. The second and subsequent families must specify `applyFontFamilyToSelector` and should set `fontType` if they aren't sans-serif:

```json
{
  "font": {
    "family": {
      "primary": {
        "value": "Rubik Variable",
        "type": "fontFamily",
        "$extensions": {
          "gamesome.font": {
            "fontType": "sans-serif",
            "imports": ["@fontsource-variable/rubik/wght.css"]
          }
        }
      },
      "secondary": {
        "value": "Lora Variable",
        "type": "fontFamily",
        "$extensions": {
          "gamesome.font": {
            "fontType": "serif",
            "imports": ["@fontsource-variable/lora/wght.css"],
            "applyFontFamilyToSelector": ".font-serif"
          }
        }
      }
    }
  }
}
```

## Tailwind CSS integration

If you use Tailwind, it sets its own `font-family` on the `html` element via preflight. To prevent conflicts with the font families generated by this package, disable Tailwind's font family settings:

```javascript
// tailwind.config.js
theme: {
  extend: {
    fontFamily: { sans: [], serif: [] },
  }
}
```

Set each font category you use to an empty array. This prevents Tailwind from overriding the font families set by the generated CSS.

## Formatter options

The formatter accepts the following options via `options` in your Style Dictionary file config:

| Option           | Type      | Description                                                       |
| ---------------- | --------- | ----------------------------------------------------------------- |
| `prettifyOutput` | `boolean` | Prettifies the CSS output. Useful for debugging. Default: `false` |

## Preloading fonts

Preloading fonts via `<link rel="preload">` triggers the browser to fetch font files early — before the CSS is even parsed. This prevents the flash of fallback text entirely. See [web.dev on preloading webfonts](https://web.dev/optimize-webfont-loading/#preload-your-webfont-resources).

By default, the formatter includes the **Latin variant** of the **first CSS import** for each font family in the manifest — the same default as `@gamesome/astro-font` and similar to `@next/font`. This is a good compromise between loading speed and CLS: preloading every font variant would slow down the initial page load, but preloading the most common one prevents visible text reflow for the majority of users.

The manifest is written to the `buildPath` (the same directory as the CSS output). Each entry contains all the attributes you need for a `<link>` tag:

```json
[
  {
    "href": "@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2",
    "rel": "preload",
    "as": "font",
    "type": "font/woff2",
    "crossorigin": "anonymous"
  }
]
```

The `href` values are fontsource package paths. A bundler plugin is needed to resolve these to URLs the browser can fetch.

### Vite plugin

For Vite projects, use the included preload plugin to automatically inject `<link rel="preload">` tags into your HTML:

```js
// vite.config.ts
import { fontPreloadPlugin } from "@gamesome/style-dictionary-font/font-preload-vite-plugin";

export default defineConfig({
  plugins: [
    fontPreloadPlugin("src/tokens/generated/preloads.json"),
  ],
});
```

The plugin resolves each fontsource package path to a URL that the browser can fetch, both in dev mode and production builds.

### `PreloadManifestEntry` type

The package exports a `PreloadManifestEntry` type for use in your build scripts or templates:

```typescript
import type { PreloadManifestEntry } from "@gamesome/style-dictionary-font";

const manifest: PreloadManifestEntry[] = JSON.parse(
  fs.readFileSync("src/tokens/generated/preloads.json", "utf-8")
);

// Each entry has: href, rel, as, type, crossorigin
```

## FAQ

### My fonts are not showing up

Check the terminal and browser console for errors first. If there are none, verify that:

1. The `value` in your token matches the `font-family` in the fontsource CSS exactly
2. The font package is installed in `node_modules`
3. The generated CSS file is imported in your application
4. For the second and subsequent font families, `applyFontFamilyToSelector` is set to a valid selector that exists in your markup

### Bundler compatibility

The generated CSS uses fontsource package paths in `url()` functions (e.g. `url(@fontsource-variable/rubik/files/...)`). This requires a bundler that resolves package paths in CSS — Vite does this automatically. For other bundlers, you may need to configure a CSS resolver plugin.

## Tools

These tools can help you compare fonts and fine-tune fallback scaling:

- **Perfect-ish Font Fallback:** https://www.industrialempathy.com/perfect-ish-font-fallback/ — visually compare a web font against system fallbacks and preview override values. Useful for choosing which fallback font pairs best with your web font.
- **Font overlay bookmarklet:** https://lucaslarson.github.io/fallback/ — overlay a different font on your page to compare
- **Web-safe fonts reference:** https://www.w3schools.com/cssref/css_websafe_fonts.php — check which fonts are available across platforms
- **Font style matcher:** https://meowni.ca/font-style-matcher/ — visually compare two fonts side by side

## License

MIT
