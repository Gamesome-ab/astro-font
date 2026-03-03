# @gamesome/style-dictionary-font

A [Style Dictionary](https://amzn.github.io/style-dictionary/) v4 format and action for generating optimized `@font-face` CSS with scaled fallback fonts to reduce [CLS](https://web.dev/articles/cls).

Works with [Fontsource](https://fontsource.org/) variable fonts. Fallback fonts are automatically scaled using [Capsize](https://seek-oss.github.io/capsize/) — the same algorithm used by `@next/font`.

## Installation

```bash
npm install @gamesome/style-dictionary-font
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

### 2. Create a build script

```js
import StyleDictionary from "style-dictionary";
import {
  gamesomeFontFaceFormat,
  buildFontFaceDeclarations,
} from "@gamesome/style-dictionary-font";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);

// Register the format
StyleDictionary.registerFormat(gamesomeFontFaceFormat);

// Read the CSS from fontsource
const rubikCssPath = require.resolve("@fontsource-variable/rubik/wght.css");
const cssContents = {
  "@fontsource-variable/rubik/wght.css": fs.readFileSync(rubikCssPath, "utf-8"),
};

// Copy font files so relative ./files/ URLs resolve
const fontsourceFilesDir = path.join(path.dirname(rubikCssPath), "files");
const outDir = "src/tokens/generated/files";
fs.mkdirSync(outDir, { recursive: true });
for (const file of fs.readdirSync(fontsourceFilesDir)) {
  fs.copyFileSync(path.join(fontsourceFilesDir, file), path.join(outDir, file));
}

// Build declarations
const fontFaceDeclarations = buildFontFaceDeclarations(
  [{ name: "Rubik Variable", imports: ["@fontsource-variable/rubik/wght.css"] }],
  cssContents
);

const sd = new StyleDictionary({
  source: ["src/tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/tokens/generated/",
      files: [{
        destination: "fonts.css",
        format: "gamesome/font-face-css",
        options: { fontFaceDeclarations },
      }],
    },
  },
});

await sd.buildAllPlatforms();
```

### 3. Import the generated CSS

```js
import "./tokens/generated/fonts.css";
```

The generated CSS includes:
- A selector rule with the full font stack (primary + scaled fallbacks + system fonts)
- `@font-face` declarations for the primary font (from fontsource)
- `@font-face` declarations for each scaled fallback font

## Token extension properties

Properties available on `$extensions["gamesome.font"]`:

| Property | Type | Description |
|----------|------|-------------|
| `fontType` | `"sans-serif" \| "serif" \| "mono"` | Font type — determines default fallbacks |
| `imports` | `string[]` | CSS import paths from fontsource |
| `staticFontName` | `string` | Override the font name used for Capsize lookup |
| `fallbacks` | `string[] \| false` | Custom fallback fonts, or `false` to disable |
| `appendFontFamilies` | `string \| false` | Custom system font stack to append |
| `applyFontFamilyToSelector` | `string \| false` | CSS selector (required for 2nd+ font families) |

## Adding multiple fonts

Add more font families to your token file. The second and subsequent families must specify `applyFontFamilyToSelector`:

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

## API

### `gamesomeFontFaceFormat`

Style Dictionary format. Register with `StyleDictionary.registerFormat(gamesomeFontFaceFormat)`. Use as `format: "gamesome/font-face-css"` in your config.

**Options:**
- `fontFaceDeclarations` — required, built via `buildFontFaceDeclarations()`
- `prettifyOutput` — optional boolean, prettifies the CSS output

### `gamesomeFontFaceAction`

Style Dictionary action. Register with `StyleDictionary.registerAction(gamesomeFontFaceAction)`. Use as `actions: ["gamesome/font-face-action"]`.

**Options:**
- `fontFaceDeclarations` — required
- `cssDestination` — output filename (default: `"fonts.css"`)
- `preloadsDestination` — optional, writes a `preloads.json` manifest
- `prettifyOutput` — optional boolean

### `buildFontFaceDeclarations(families, cssContents)`

Helper that builds the `fontFaceDeclarations` object from font families and their raw CSS contents.

### `extractFontFamiliesFromTokens(tokens)`

Walks a Style Dictionary token tree and extracts `FontFamily[]` from tokens with `$extensions["gamesome.font"]`.

## License

MIT
