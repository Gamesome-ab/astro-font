import {
	parsedFamilies,
	generateCss,
} from "@gamesome/core-font";
import type { FontFaceDeclarations } from "@gamesome/core-font";
import { extractFontFamiliesFromTokens } from "./tokenHelpers";

/**
 * A Style Dictionary action that generates @font-face CSS and writes it to a file,
 * along with an optional preloads manifest JSON.
 *
 * Register with:
 * ```js
 * StyleDictionary.registerAction(gamesomeFontFaceAction);
 * ```
 *
 * Then reference in your config:
 * ```js
 * {
 *   platforms: {
 *     css: {
 *       buildPath: 'build/',
 *       actions: ['gamesome/font-face-action'],
 *       options: {
 *         fontFaceDeclarations: { ... },
 *         cssDestination: 'fonts.css',
 *         preloadsDestination: 'preloads.json', // optional
 *         prettifyOutput: false,
 *       }
 *     }
 *   }
 * }
 * ```
 */
export const gamesomeFontFaceAction = {
	name: "gamesome/font-face-action",
	do: async (dictionary, platform, options, volume) => {
		const fontFaceDeclarations: FontFaceDeclarations =
			options?.fontFaceDeclarations || {};
		const prettifyOutput: boolean = options?.prettifyOutput || false;
		const cssDestination: string =
			options?.cssDestination || "fonts.css";
		const preloadsDestination: string | undefined =
			options?.preloadsDestination;

		const families = extractFontFamiliesFromTokens(dictionary.tokens);

		if (!families.length) {
			console.log(
				"[gamesome/font-face-action] No font tokens found with gamesome.font extensions"
			);
			return;
		}

		const parsed = parsedFamilies(families);
		const result = await generateCss({
			families: parsed,
			fontFaceDeclarations,
			prettifyOutput,
		});

		const buildPath = platform.buildPath || "";
		const fs = volume || await import("fs");

		await fs.promises.mkdir(buildPath, { recursive: true });
		await fs.promises.writeFile(
			buildPath + cssDestination,
			result.css
		);
		console.log(
			`[gamesome/font-face-action] Wrote CSS to ${buildPath}${cssDestination}`
		);

		if (preloadsDestination && result.preloads.length) {
			await fs.promises.writeFile(
				buildPath + preloadsDestination,
				JSON.stringify(result.preloads, null, 2)
			);
			console.log(
				`[gamesome/font-face-action] Wrote preloads manifest to ${buildPath}${preloadsDestination}`
			);
		}
	},
	undo: async (dictionary, platform, options, volume) => {
		const cssDestination: string =
			options?.cssDestination || "fonts.css";
		const preloadsDestination: string | undefined =
			options?.preloadsDestination;
		const buildPath = platform.buildPath || "";
		const fs = volume || await import("fs");

		try {
			await fs.promises.unlink(buildPath + cssDestination);
		} catch {}
		if (preloadsDestination) {
			try {
				await fs.promises.unlink(buildPath + preloadsDestination);
			} catch {}
		}
	},
};
