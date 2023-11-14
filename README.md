# Astro Font

This package will allow you to add fonts to your Astro project in a similar manner to how @next/font does it (further reading [here](https://vercel.com/blog/nextjs-next-font)). More specifically:

- Your fonts will be hosted on your own domain together with the rest of your assets (for [privacy / GDPR](https://www.cookieyes.com/documentation/features/integrations/google-fonts-and-gdpr/))
- Fallback fonts will be calculated using the same algorithm as @next/font to reduce [CLS](https://web.dev/articles/cls)
- You can customise fallback fonts for the fonts you don't preload (similar to [@next/font](https://nextjs.org/docs/pages/api-reference/components/font#adjustfontfallback))
- You can easily preload fonts, preventing CLS altogether

In addition to the above, the package also adds some optimisations related to localised content. Through the use of our Astro component, you can pass the current locale to the font loader. This will allow you to preload different fonts for different languages. This is useful for languages like Arabic, Japanese, and Korean that use different fonts than the Latin alphabet.

This package also makes sure that all font-related css is lifted from the bundled CSS file, and placed directly in the `<head>` element. This is crucial for fallbacks to be applied before the large-ish css file is loaded.

## Getting started

### 1. Install the package

Run either:

```bash
npm install @gamesome/astro-font
```

or:

```bash
yarn add @gamesome/astro-font
```

### 2. Select and install your fonts

For this package to work, you must have fonts available locally in your project. The package is built around [fontsource](https://fontsource.org/), but might work with other packages as well.

Go to https://fontsource.org/ and select the fonts you want to use. We suggest (as does @next/font) that you select a variable font. This will allow you to use a single font file for all weights.

Go to the "Install" tab of your selected font and follow the instructions to install the font in your project.

### 3. Find the file names and paths to the installed fonts

This package needs a list of css files to load fonts from. To create this list, you need to figure out which ones you need:

1.  Go to the `node_modules` folder in your project.
1.  Find the @fontsource or @fontsource-variable folder and the fonts you installed.
1.  In the `index.css` you can get a hint of what the "normal" font is called. You will probably find that you want the `wght.css` and either `italic.css` or `slnt.css`. For static fonts you want a bunch of font-weights. Note that if you don't include all font weights (relevant only for static fonts) and all styles (italic, slanted, etc) you will get faux italics and faux bolds.

### 4. Verify the font family name

The font family name can be found on Google Fonts or on Fontsource. However for variable fonts, Fontsource adds ` Variable` to the end of it.

The easiest way to find it is through one of the css files you saw in the previous step. You will have blocks similar to the one below. The font family name is the string after `font-family:`. In this case it is `Roboto Flex Variable`.

```css
@font-face {
	font-family: "Roboto Flex Variable";
	font-style: normal;
	font-display: swap;
	font-weight: 100 1000;
	src: url(./files/roboto-flex-cyrillic-wght-normal.woff2) format("woff2-variations");
	unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
```

### 5. Add `astro-font` to your astro config

The example below assumes that you use `astro.config.mjs`. If you use another file type, you might need to adapt the statements slightly.

Import the package in your astro config:

```javascript
import astroFont from "@gamesome/astro-font";
```

Add a configuration for the plugin. Replace `Rubik Variable` with your selected font family name and the imports list accordingly:

```javascript
export default defineConfig({
	integrations: [
		astroFont({
			families: [
				{
					name: "Rubik Variable",
					imports: [
						"@fontsource-variable/rubik/wght.css",
						"@fontsource-variable/rubik/wght-italic.css",
					],
				},
			],
		}),
	],
});
```

### 6. Add the font loader to your markup

Find where your astro project creates the `<head>` tag. It is likely in something like `BaseLayout.astro`. In this file, add the following import:

```javascript
import AstroFont from "@gamesome/astro-font/AstroFont.astro";
```

Then add the imported component in the `<head>` tag. It should look something like this:

```html
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width" />
	<link rel="icon" type="image/x-icon" href="/favicon.svg" />
	<AstroFont />
</head>
```

For now, we don't pass any information to the component (other than what is passed though the plugin). For localised preloads to work, you need to pass pass the current locale to the component. See [The AstroFont component](#the-astrofont-component) for more information.

### 7. Start up the project

When you start the project, you should see all of your fonts replaced with the one you selected. You can go into the computed styles in Chrome to verify (see [this](https://stackoverflow.com/questions/18900720/where-to-see-font-files-loaded-by-chrome-in-the-inspector) for more information).

If it is not working, see the [FAQ](#my-fonts-are-not-loading) section.

### 8. Adding more font families

Adding more fonts to your project is almost as simple as just adding more font families to your config. With two additional properties:

- You need to do is to add a selector to the font families after the first. This is because the first font family is applied to the `html` element by default and we need your input to know where to apply the other ones.
- If your additional font families are not "sans-serif" you need to specify the type of font (e.g. `serif`) to get appropriate fallbacks.

Updated `astro.config.mjs`:

```javascript
export default defineConfig({
	integrations: [
		astroFont({
			families: [
				{
					name: "Rubik Variable",
					imports: [
						"@fontsource-variable/rubik/wght.css",
						"@fontsource-variable/rubik/wght-italic.css",
					],
				},
				{
					name: "EB Garamond Variable",
					type: "serif",
					applyFontFamilyToSelector: ".font-serif",
					imports: [
						"@fontsource-variable/eb-garamond/wght.css",
						"@fontsource-variable/eb-garamond/wght-italic.css",
					],
				},
			],
		}),
	],
});
```

### 9. Preloading fonts

With the setup so far, we have guessed that you want to preload some of your fonts. More specifically we preload the latin (not latin-ext) variant of each of the first css files you specified. In the example above we preload `@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2` and `@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-normal.woff2`.

Let's say that we want to preload the italic variant of `EB Garamond` instead of the normal one. We can then update the config as follows:

```javascript
export default defineConfig({
	integrations: [
		astroFont({
			families: [
				{
					name: "Rubik Variable",
					imports: [
						"@fontsource-variable/rubik/wght.css",
						"@fontsource-variable/rubik/wght-italic.css",
					],
				},
				{
					name: "EB Garamond Variable",
					type: "serif",
					applyFontFamilyToSelector: ".font-serif",
					imports: [
						{
							css: "@fontsource-variable/eb-garamond/wght.css",
							preload: false,
						},
						{
							css: "@fontsource-variable/eb-garamond/wght-italic.css",
							preload: true,
						},
					],
				},
			],
		}),
	],
});
```

## Configuration

Here we list all the available configuration options for `astro-font`. The root of the config object contains:
- `families` - takes an array of [FontFamily](#fontfamily) objects
- `prettifyOutput` - takes a boolean. If set to true, we will prettify the output of the css files. This is useful for debugging, but will increase the size of the files. Default is false.

### `FontFamily`

#### `name`

The name of the font family you are adding. The name must be the same as the imported css files. See [Getting started - Step 4](#4-verify-the-font-family-name) for more information.

**Example:** `"Rubik Variable"`

#### `staticFontName`

For font scaling, we need the name of the static font, i.e. the name of the non-variable font. Usually this is what you passed as "name", but with " Variable" removed. If you don't set this prop, we will guess according to that. If you know better, please set this prop.

You can find all fonts available for calculation [here](https://github.com/seek-oss/capsize/blob/master/packages/metrics/scripts/googleFonts.json).

**Hint:** can likely be omitted

**Example:** `"Rubik"`

#### `type`

If you don't specify a font, we assume it is a sans-serif font. If you want to use a serif or monospaced font, you need to specify it here.

This affects the automatically selected [fallback fonts](#fallbacks) and [append font families](#appendfontfamilies).

**Hint:** either `sans-serif`, `serif`, or `monospace`

#### `imports`

An array of [FontImport](#fontimport) objects or strings. Mixing types is allowed.

Each CSS reference needs to be the same as if it was imported in a JavaScript file. This means that you need to include the `@fontsource` or `@fontsource-variable` part of the path and it needs to end with `.css`. Fonts also need to be installed in your project to work. See [Getting started - Step 2](#2-select-and-install-your-fonts) and [Getting started - Step 3](#3-find-the-file-names-and-paths-to-the-installed-fonts) for more information.

By default, we will preload one font file from the first specified font in "imports". Note that @next/font preloads all fonts by default, but we preload only the first one. We believe this is a better compromise between loading speed and CLS, however, you can change this behaviour in the [FontImport](#fontimport) object.

**Example:** see [Getting started - Step 9](#9-preloading-fonts)

#### `fallbacks`

An array of [FallbackFont](#fallbackfont) objects or strings. Mixing types is allowed.

The fonts listed here will be used before the primary font is loaded. Since we suggest preloading only part of the font, this will be useful to reduce CLS. Make sure that your list includes at least one font available on each platform / OS you support.

If no fallbacks are set, we will use the [type](#type) to select a fallback font according to:

- sans: Helvetica, "Helvetica Neue", Arial
- serif: Georgia, "Times New Roman"
- mono: Menlo, Monaco, "Courier New"

You can prevent applying fallbacks by setting this to false. Use this if you preload all fonts or don't care about CLS.

If you supply strings in this list, we will:

- add a bold variant (not doing so will likely render thin fonts on Chrome and Firefox, causing CLS)
- the bold variant of "XXX" is "XXX Bold"
- the font-weight to trigger the bold fallback is "bold" aka. 700.
- the fallback font(s) should be scaled to match the primary font

Using the [FallbackFont](#fallbackfont) object allows you to specify what the "bold" variant of the font is called, at what font-weight to apply the "bold" variant and specify alternative / predefined scaling for the font. Setting scaling here will circumvent the automatic scaling calculation, saving you some time in your builds.

#### `appendFontFamilies`

In Tailwind configurations, you often see `sans: ["Rubik Variable", ...defaultTheme.fontFamily.sans],` The object `defaultTheme.fontFamily.sans` includes a pretty comprehensive list of fonts that ensure a page will render similarly to what was intended, regardless of browser and OS. Most notably, the `sans` list includes glyphs and emojis that might be used on the page.

Failing to include some of these fonts might mean that some symbols are not rendered on your page.

We will include the same list of fonts as Tailwind does for each of the font classes. The ones we use are:

- sans-serif: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
- serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
- mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

See https://tailwindcss.com/docs/font-family for more information, and any changes on their end.

You can customise this behaviour, either by passing another string with font names, or setting this to false. Setting it to false disables the behaviour completely.

If you supply your own list of font names, make sure that you use single quotes around the string, and double quotes inside that to escape fonts with spaces.

NOTE: Tailwind (and we) assume that your default font type is sans-serif. If you are using serif or mono as your default font type,
you probably need to move emojis into that list as well.

#### `applyFontFamilyToSelector`

A string, representing a CSS selector to apply the font family to. This is only needed for the second and subsequent font families, or to override the default behaviour of the first font family. The first font family will be applied to the `html` element by default.

We will create the CSS before the font-face declarations in the `<head>` element.

Set this to `false` if you apply your font-families in another way, for example through Tailwind. However, for Tailwind specifically, see [How do I set this up together with tailwindcss?](#how-do-i-set-this-up-together-with-tailwindcss) for more information.

### `FontImport`

The FontImport object allows for more customisation of the font loading process, compared to just passing a string in the list of `FontFamily.imports`.

The first CSS file in each font family is preloaded by default. If you want to disable this, or preload additional files you need to pass this object with your preferences on the `preload` property.

#### `css`

This string is the same as you would pass directly to `FontFamily.imports`. See [FontFamily.imports](#imports) for more information.

#### `preload`

A list of [PreloadConfig](#preloadconfig) object for full customisation, or a boolean for simple customisation. Leaving this undefined will result in the default behaviour of preloading only the first font file in the list of imports.

Setting preload to `false` disables preload of this file. This may or may not be the default behaviour depending on if it is the first in the list or not.

Setting preload to `true` enables "simple preload" of the file, similar to what is applied to the first file in the list of imports.

The default behaviour ("simple preload") will preload the Latin variant of the font (not Latin-ext) for all locales. I.e the same as setting preload to `[{includeFontsMatching: ["latin(?!-ext)"], forLocalesMatching: undefined}]`. See [PreloadConfig](#preloadconfig) for more information.

### `FallbackFont`

The FallbackFont object allows for more customisation of the fallback font process, compared to just passing a string in the list of `FontFamily.fallbacks`. It also allows you to override / specify scaling for the font, saving you some time on your builds.

#### `name`

The name of the font, as it is spelled in the OS. This is the name you would pass to `font-family` in CSS.

#### `bold`

An object with `suffix`, `weight` and `scaling` properties. Can also be set to `false` to disable bold fallbacks.

Creating a good bold variant can be beneficial. Because each bold character can be significantly wider than the regular text, a block of bold text will take up more rows. This will cause CLS. Also, faux bold does not seem to be a thing on fallback fonts [see](https://www.smashingmagazine.com/2013/02/setting-weights-and-styles-at-font-face-declaration/#problem-if-the-fallback-font-loads-weights-and-styles-will-be-lost), at least not on Chrome and Firefox.

The `suffix` is the string that is appended to the font name to get the bold variant. The default is `" Bold"`.

The `weight` is the font-weight that triggers the bold variant. The default is `bold` (aka. `700`).

`scaling` takes a [FontScaling](#fontscaling) object. If you don't set this, we will use the same scaling as the non-bold fallback. Our testing shows that you likely want to set a slightly smaller `sizeAdjust` for the bold variant (e.g. 5% smaller than the non-bold variant). Note that the properties here override the base properties. I.e. if you want to reduce the `sizeAdjust` by 5% you need to set it to a value that is 5% smaller than the non-bold variant, not 0.95!

#### `scaling`

A [FontScaling](#fontscaling) object. If you don't set this, we will calculate the scaling for you. Setting this manually completely circumvents the scaling calculations, meaning you need to set all the properties you want to use.

Once you have locked in all the fonts you want to use, you should probably set scaling manually through this prop. Doing so will reduce the build time of your project.

### `PreloadConfig`

The PreloadConfig object allows for full customisation of which font files to preload and for which locales. To use this you pass RegExp **bodies** to `includeFontsMatching` and `forLocalesMatching`. Unfortunately you cannot pass actual RegExp objects, because they are not serialisable to JSON (which is used to pass the config to the plugin).

You must set `includeFontsMatching` to a list of strings. Leaving `forLocalesMatchig` undefined will result in the default behaviour of preloading for all locales.

Example 1: To preload all latin fonts for all locales:

```javascript
{
	includeFontsMatching: ["latin"];
}
```

Example 2: To preload the base latin font (not latin-ext) for all locales:

```javascript
{
	includeFontsMatching: ["latin(?!-ext)"];
}
```

Example 3: To preload all fonts for all locales:

```javascript
{
	includeFontsMatching: [".+"];
}
```

Example 4: To preload Latin fonts for all locales except those with Arabic language, and preload Arabic fonts for Arabic locales:

```javascript
[
	{ includeFontsMatching: ["latin"], forLocalesMatching: ["^(?!ar-)"] },
	{ includeFontsMatching: ["arabic"], forLocalesMatching: ["ar-"] },
];
```

#### `includeFontsMatching`

A list of strings that will function as "OR" filters. Each string should be a RegExp body. For example, passing just `["Latin"]` will match both the Latin and Latin-ext variants of the font. Passing `["Latin(?!-ext)"]` will match only the Latin variant.

Setting this might be tricky since it requires some knowledge of the available font files, the content of them and the structure of their file names. However, it might be necessary if our guesses don't match your needs or your selected font.

#### `forLocalesMatching`

Behaves the same as `includeFontsMatching`, but for locales, except that if it is left undefined, the preload will be applied to all locales.

### `FontScaling`

The FontScaling object allows for full customisation of the font scaling that is applied to the fallback fonts. You set the CSS properties directly, but camelcased. The props available are: `ascentOverride`, `descentOverride`, `sizeAdjust` and `lineGapOverride`. They all take strings and should be in percentage values, including the `%` sign.

## Notes

A lot of tools, like the last one mentioned in [tools](#tools), will focus on letter- and word-spacing. They will suggest that you use JavaScript to switch the font once the primary one is loaded. Although this works great for some setups, you will likely get some CLS regardless but perhaps in two steps. Our approach for fallbacks will make sure that each block of text takes up the same height, and through including Bold variants we somewhat address the width issue.

The proposal of changing letter spacing has one additional negative side-effect (in addition to requiring JavaScript to work), which is that for languages like Arabic (that depend on characters being "connected") it will not look right.

## Tools

If you run your page in a manner that it renders the desired font (never mind if something else gets rendered first), you can use this bookmarklet to overlay another font on top of it. This means you can easily test out different fonts on your page without having to change the CSS.

The tool: https://lucaslarson.github.io/fallback/

Use this resource to check which fonts are considered web-safe: https://www.w3schools.com/cssref/css_websafe_fonts.php

This is another similar tool to compare two fonts: https://meowni.ca/font-style-matcher/

## FAQ

### My fonts are not loading

First: check that you have no errors in the terminal or the console. If you do, they should guide you to the fix. If not, it is likely that the font family is applied to the wrong element. By default, we apply the first font family you configured to the `html` element. All subsequent font families must have a selector specified. See the [`applyFontFamilyToSelector`](#applyFontFamilyToSelector) section for more information.

You can see what is rendered from `astro-font` by going to the inspector in Chrome. In the `<head>` element there should be a `<style type=text/css>` defining the font family and applying it to some selector, likely the `html` element.

### What is preloading

When we say preloading we mean adding a `<link rel="preload">` with a reference to a file. This will trigger a request for the file (font) early in the critical rendering path, without having to wait for the CSSOM to be created. @see https://web.dev/optimize-webfont-loading/#preload-your-webfont-resources

### How do I set this up together with Tailwind CSS?

@gamesome/astro-font does set `!important` on the `font-family` properties it sets, but if we don't configure Tailwind, it will also try to set this property. Hence, we propose another way.

Tailwind will use `font-sans` as the default `font-family` and apply that to the `html` element. @gamesome/astro-font does the same: the first font family declared will be applied to the `html` element by default. If you are using that behaviour, you can set the `fontFamily.sans` property to an empty array.

Tailwind also uses the classes `font-sans`, `font-serif` and `font-mono` to apply font families to elements. If you are using any of those classes in your project, you must also disable the corresponding properties in the Tailwind config (i.e. `fontFamily.sans`, `fontFamily.serif` and `fontFamily.mono`) to empty arrays.

Note that setting these properties as empty arrays will cause Tailwind to render an invalid `html {}` style where `font-family` is `"font-family: ;"`. This is invalid CSS; but most browsers will just ignore it. If you really don't want invalid CSS in your project, you can set `fontFamily: false` in the config instead. However, that means that other CSS properties from the Tailwind preflight (https://tailwindcss.com/docs/preflight), like `line-height` will also not be set on the `html` element.

Example (extract from the) Tailwind config:

```javascript
theme: {
  extend: {
    fontFamily: { sans: [], serif: [] },
  }
}
```

## The AstroFont component
The AstroFont component takes the following props:
 - locale

If you have enabled localised preloads in your config, you need to pass the current locale to the AstroFont component. Compared to the example in [Getting started - Step 6](#6-add-the-font-loader-to-your-markup), your head tag should look something more like this:

```html
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width" />
	<link rel="icon" type="image/x-icon" href="/favicon.svg" />
	<AstroFont locale={yourLocale} />
</head>
```

## Our implementation choices

### Font loading

Turns out that loading external files in the build process with Vite was not as easy as we had hoped. Also, Google Fonts use a different interface for each font, making it super difficult for the user to configure the fonts they need (see the @next/font [implementation](https://github.com/vercel/next.js/blob/f7b979c9cf1bb56f050e22c8a25e9188b85b2bdc/packages/font/src/google/index.ts)).

Using fontsource simplifies this process by allowing us to look through the `node_modules` folder and write our imports as strings. This approach is very similar to what [Astro themselves suggest](https://docs.astro.build/en/guides/fonts/#using-fontsource), which means that the transition into using this package should be smooth for most users.

## Roadmap

### Localisation

At the moment we only use the locale passed to switch between which font variants are preloaded. It is not obvious how you would use this package if you are using completely different fonts for different languages. A workaround could be to apply the fontFamilies to different CSS selectors, but that is not ideal. We are open to suggestions on how to solve this. The current proposal is to add a `forLocalesMatching` on the `FontFamily` object.