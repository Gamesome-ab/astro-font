import {
	parsedFamilies,
	generateCss,
	fontFamilyFromFamilyName,
	styleNameFromCssImport,
} from "@gamesome/core-font";
import type { FontFaceDeclarations } from "@gamesome/core-font";
import { extractFontFamiliesFromTokens } from "./tokenHelpers";

/**
 * A Style Dictionary format that generates @font-face CSS with fallback font scaling.
 *
 * Register with:
 * ```js
 * StyleDictionary.registerFormat(gamesomeFontFaceFormat);
 * ```
 *
 * Then reference in your config:
 * ```js
 * {
 *   files: [{
 *     destination: 'fonts.css',
 *     format: 'gamesome/font-face-css',
 *     options: {
 *       // Required: map of font family key -> style name -> CSS string
 *       fontFaceDeclarations: { ... },
 *       // Optional: prettify the CSS output
 *       prettifyOutput: false,
 *     }
 *   }]
 * }
 * ```
 */
export const gamesomeFontFaceFormat = {
	name: "gamesome/font-face-css",
	format: async function ({ dictionary, options }) {
		const fontFaceDeclarations: FontFaceDeclarations =
			options?.fontFaceDeclarations || {};
		const prettifyOutput: boolean = options?.prettifyOutput || false;

		const families = extractFontFamiliesFromTokens(dictionary.tokens);

		if (!families.length) {
			return "/* No font tokens found with gamesome.font extensions */";
		}

		const parsed = parsedFamilies(families);
		const result = await generateCss({
			families: parsed,
			fontFaceDeclarations,
			prettifyOutput,
		});

		return result.css;
	},
};

/**
 * Helper to build fontFaceDeclarations from CSS file contents.
 *
 * @param families - Array of { name, imports } where imports are CSS import paths
 * @param cssContents - Map of CSS import path -> raw CSS content string
 * @returns FontFaceDeclarations object ready for use with generateCss
 */
export function buildFontFaceDeclarations(
	families: { name: string; imports: (string | { css: string })[] }[],
	cssContents: Record<string, string>
): FontFaceDeclarations {
	const declarations: FontFaceDeclarations = {};

	for (const family of families) {
		const familyKey = fontFamilyFromFamilyName(family.name);
		declarations[familyKey] = {};

		for (const imp of family.imports) {
			const cssPath = typeof imp === "string" ? imp : imp.css;
			const styleName = styleNameFromCssImport(cssPath);
			declarations[familyKey][styleName] = cssContents[cssPath] || "";
		}
	}

	return declarations;
}
