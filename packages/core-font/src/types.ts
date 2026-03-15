//#region User-facing types

export interface PreloadConfig {
	/**
	 * A list of strings that will function as "OR" filters. Each string is treated as a RegExp body.
	 */
	includeFontsMatching: string[];
	/**
	 * A list of strings that will function as "OR" filters. Each string is treated as a RegExp body.
	 *
	 * Leaving this undefined means that the patter will be applied to all locales, i.e the same as setting "forLocales" to:
	 * [".+"]
	 */
	forLocalesMatching?: string[];
}

export interface FontImport {
	/**
	 * A font import statement.
	 *
	 * Example: "@fontsource-variable/rubik/wght.css"
	 */
	css: string;
	/**
	 * To override the default preload behaviour you can pass a boolean or one or more {@link PreloadConfig} objects.
	 *
	 * Setting it to true will use the default preload behaviour, which is to preload all latin fonts (not latin-ext) for all locales.
	 */
	preload?: PreloadConfig[] | boolean;
}

export interface FontScaling {
	ascentOverride?: string;
	descentOverride?: string;
	sizeAdjust?: string;
	lineGapOverride?: string;
}

export interface FallbackFont {
	/**
	 * The name of the font, as it is spelled in the OS
	 */
	name: string;

	/**
	 * Allows overriding how we set the "bold" variant of the font. Also allows custom scaling of the "bold" variant.
	 *
	 * Setting this to false will prevent a "bold" variant from being supplied. Leaving some props in the "bold" object undefined will
	 * use the default values.
	 *
	 * "scaling" takes the same object as the "scaling" prop in the root of this object (see {@link FontScaling}).
	 */
	bold?:
		| {
				suffix: string;
				weight: string | number;
				scaling?: FontScaling;
		  }
		| false;

	/**
	 * Once scaling has been calulated for your specific set of fonts, we don't necessarily need to calculate that for each page.
	 *
	 * This prop allows you to hardcode the calculated values, as well as override the calculated values.
	 */
	scaling?: FontScaling | false;
}

export interface ApplyFontFamilyToSelector {
	/**
	 * CSS selector to apply the generated font-family to.
	 */
	selector?: string | false;
	/**
	 * CSS custom property name to define the generated font-family stack as on :root.
	 */
	cssVariable?: string;
}

export interface ParsedApplyFontFamilyToSelector {
	selector?: string;
	cssVariable?: string;
}

export interface FontFamily {
	/**
	 * Name is the font name of the primary font. It is important that this matches the name in
	 * fontsource, e.g add "Variable" to the font name if it is a variable font.
	 */
	name: string;

	/**
	 * The name of the static font, as it is defined by capsize (https://github.com/seek-oss/capsize/blob/master/packages/metrics/scripts/googleFonts.json).
	 *
	 * This can likely be omitted.
	 */
	staticFontName?: string;

	/**
	 * We need to know what type of font you are setting to be able to autimatically select fallback fonts {@link fallbacks} and append font families {@link appendFontFamilies}.
	 *
	 * Defaults to "sans-serif"
	 */
	type: "serif" | "sans-serif" | "mono";

	/**
	 * Takes a list of strings or {@link FontImport} objects or a combination of the two types.
	 *
	 * @example
	 *
	 * [
	 * 	"@fontsource-variable/rubik/wght.css",
	 *   {
	 *     css: "@fontsource-variable/rubik/wght-italic.css",
	 *     preload: false
	 *   }
	 * ]
	 */
	imports: (FontImport | string)[];

	/**
	 * A list of either {@link FallbackFont} or strings.
	 *
	 * If you don't set this, we will use defaults based on the `type` you set.
	 *
	 * Setting this to false means no fallbacks will be loaded.
	 */
	fallbacks?: (FallbackFont | string)[] | false;

	/**
	 * A string representing font-families to be appended after the primary font-family
	 * and fallback font-families. Use this to make sure that emojis etc are rendered
	 * correctly and that there is always a ui-font available.
	 *
	 * The fonts in this list could also be considered fallbacks, but they differ in that
	 * they are not used to calculate scaling. They should be seen as a last resort.
	 *
	 * Set this to false to disable this behaviour.
	 */
	appendFontFamilies?: string | false;

	/**
	 * This plugin will set the generated font-family on the class / element of your choice, and/or expose the full generated stack as a CSS custom property.
	 * This is done in one of the initial style tags on each page. If you supply several families to this plugin, you need to set this on all but the first of your families.
	 *
	 * Sidenote: don't forget to prevent tailwind from setting font-family if you are using tailwind. (see readme)
	 *
	 * set this to false if you prefer to do this elsewhere (perhaps in a tailwind config of similar).
	 * @example ".font-serif"
	 */
	applyFontFamilyToSelector?: string | false | ApplyFontFamilyToSelector;
}

export interface FontOptions {
	/**
	 * list of FontFamily objects. See {@link FontFamily} for details.
	 */
	families: FontFamily[];
	/**
	 * In development it might be useful to prettify the generated css to make it easier to read.
	 *
	 * Defaults to false.
	 */
	prettifyOutput?: boolean;
}

//#endregion

//#region Parsed/internal types

export interface ParsedFallbackFont {
	name: FallbackFont["name"];
	bold: Required<FallbackFont>["bold"];
	scaling: Required<FallbackFont>["scaling"] | true;
}

export interface ParsedPreloadConfig extends PreloadConfig {
	forLocalesMatching: Required<PreloadConfig>["forLocalesMatching"];
}

export interface ParsedFontImport extends FontImport {
	name: string;
	preload: ParsedPreloadConfig[];
}

export interface ParsedFontFamily
	extends Omit<Required<FontFamily>, "fallbacks" | "applyFontFamilyToSelector"> {
	imports: ParsedFontImport[];
	fallbacks: ParsedFallbackFont[] | false;
	applyFontFamilyToSelector: ParsedApplyFontFamilyToSelector | false;
}

//#endregion

//#region generateCss types

export interface FontFaceDeclarations {
	[familyKey: string]: {
		[styleName: string]: string;
	};
}

export interface GenerateCssInput {
	families: ParsedFontFamily[];
	fontFaceDeclarations: FontFaceDeclarations;
	locale?: string;
	prettifyOutput?: boolean;
}

export interface GenerateCssOutput {
	css: string;
	preloads: string[];
}

//#endregion
