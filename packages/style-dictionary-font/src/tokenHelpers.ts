import type {
	ApplyFontFamilyToSelector,
	FontFamily,
	FontImport,
} from "@gamesome/core-font";

interface GamesomeFontExtension {
	/** The static font name for capsize metrics lookup (defaults to name without "Variable") */
	staticFontName?: string;
	/** Font type: "sans-serif", "serif", or "mono" */
	fontType?: "sans-serif" | "serif" | "mono";
	/** CSS imports - can be strings or FontImport objects */
	imports: (string | FontImport)[];
	/** Fallback font names or false to disable */
	fallbacks?: (string | { name: string; scaling?: object | false; bold?: object | false })[] | false;
	/** Font families to append after primary + fallbacks */
	appendFontFamilies?: string | false;
	/** CSS selector and/or custom property for the generated font-family */
	applyFontFamilyToSelector?: string | false | ApplyFontFamilyToSelector;
}

/**
 * Extracts FontFamily[] configuration from style-dictionary tokens that use
 * the `$extensions["gamesome.font"]` convention.
 *
 * Token structure:
 * ```json
 * {
 *   "font": {
 *     "family": {
 *       "primary": {
 *         "value": "Rubik Variable",
 *         "type": "fontFamily",
 *         "$extensions": {
 *           "gamesome.font": {
 *             "imports": ["@fontsource-variable/rubik/wght.css"],
 *             "fontType": "sans-serif"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Both the legacy `value` / `type` keys and the DTCG `$value` / `$type` keys
 * are supported. When a token uses `$value`, the DTCG form takes precedence.
 */
export function extractFontFamiliesFromTokens(
	tokens: Record<string, any>
): FontFamily[] {
	const families: FontFamily[] = [];
	walkTokens(tokens, families);
	return families;
}

function walkTokens(
	obj: Record<string, any>,
	families: FontFamily[]
): void {
	if (!obj || typeof obj !== "object") return;

	// Check if this is a token with gamesome.font extension.
	// DTCG tokens use `$value`; legacy tokens use `value`.
	const value = tokenValue(obj);
	if (value && obj.$extensions && obj.$extensions["gamesome.font"]) {
		const ext: GamesomeFontExtension = obj.$extensions["gamesome.font"];
		// Use the original value when available (SD transforms may wrap the value in quotes)
		const rawValue: string = tokenValue(obj.original) || value;
		const name = rawValue.replace(/^['"]|['"]$/g, "");
		const family: FontFamily = {
			name,
			type: ext.fontType || "sans-serif",
			imports: ext.imports,
		};

		if (ext.staticFontName) {
			family.staticFontName = ext.staticFontName;
		}
		if (ext.fallbacks !== undefined) {
			family.fallbacks = ext.fallbacks as FontFamily["fallbacks"];
		}
		if (ext.appendFontFamilies !== undefined) {
			family.appendFontFamilies = ext.appendFontFamilies;
		}
		if (ext.applyFontFamilyToSelector !== undefined) {
			family.applyFontFamilyToSelector = ext.applyFontFamilyToSelector;
		}

		families.push(family);
		return;
	}

	// Recurse into child objects
	for (const key of Object.keys(obj)) {
		if (key === "$extensions") continue;
		walkTokens(obj[key], families);
	}
}

/**
 * Reads a token's value regardless of whether it uses the DTCG `$value` key
 * or the legacy `value` key.
 */
function tokenValue(token: Record<string, any> | undefined): string | undefined {
	if (!token || typeof token !== "object") return undefined;
	return token.$value ?? token.value;
}
