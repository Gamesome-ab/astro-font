import fs from "fs";
import path from "path";
import { createRequire } from "module";
import {
	parsedFamilies,
	generateCss,
	fontFamilyFromFamilyName,
	styleNameFromCssImport,
} from "@gamesome/core-font";
import type { FontFamily, FontFaceDeclarations } from "@gamesome/core-font";
import { extractFontFamiliesFromTokens } from "./tokenHelpers";
import type { PreloadManifestEntry } from "./types";

const nodeRequire = createRequire(path.join(process.cwd(), "/"));

/**
 * A Style Dictionary format that generates @font-face CSS with fallback font scaling.
 *
 * CSS imports from fontsource are resolved automatically from token extensions.
 * Font URLs use package paths (e.g. @fontsource-variable/rubik/files/...) which
 * bundlers like Vite resolve automatically.
 */
export const gamesomeFontFaceFormat = {
	name: "gamesome/font-face-css",
	format: async function ({ dictionary, options, platform }) {
		const prettifyOutput: boolean = options?.prettifyOutput || false;
		const buildPath = platform?.buildPath || "";

		const families = extractFontFamiliesFromTokens(dictionary.tokens);

		if (!families.length) {
			return "/* No font tokens found with gamesome.font extensions */";
		}

		const fontFaceDeclarations = resolveFontFaceDeclarations(families);

		const parsed = parsedFamilies(families);
		const result = await generateCss({
			families: parsed,
			fontFaceDeclarations,
			prettifyOutput,
		});

		// Always write preload manifest to avoid stale files from previous builds.
		const manifest: PreloadManifestEntry[] = result.preloads.map((href) => ({
			href,
			rel: "preload",
			as: "font",
			type: "font/woff2",
			crossorigin: "anonymous",
		}));

		const manifestPath = path.join(buildPath, "preloads.json");
		fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
		fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

		return result.css;
	},
};

function resolveFontFaceDeclarations(
	families: FontFamily[]
): FontFaceDeclarations {
	const cssContents: Record<string, string> = {};

	for (const family of families) {
		for (const imp of family.imports) {
			const cssImport = typeof imp === "string" ? imp : imp.css;
			if (cssContents[cssImport]) continue;

			const cssPath = nodeRequire.resolve(cssImport);
			let css = fs.readFileSync(cssPath, "utf-8");

			// Replace relative ./files/ paths with the package path so bundlers can resolve them
			// e.g. url(./files/rubik-latin.woff2) → url(@fontsource-variable/rubik/files/rubik-latin.woff2)
			const packageBase = cssImport.replace(/\/[^/]+$/, "");
			css = css.replace(/url\(\.\/files\//g, `url(${packageBase}/files/`);

			cssContents[cssImport] = css;
		}
	}

	return buildFontFaceDeclarations(families, cssContents);
}

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
