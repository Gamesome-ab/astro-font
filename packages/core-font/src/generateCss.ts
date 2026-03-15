import { createFontStack } from "@capsizecss/core";
import CleanCSS from "clean-css";

// @ts-ignore
import { fontFamilyToCamelCase as toCC } from "@capsizecss/metrics";

import { createBoldFallbackFontFace } from "./createBoldFallbackFontFace";
import {
	calculateBoldFallbackFontFaces,
	getMetricsCollectionEntry,
	type MetricsCollection,
} from "./calculateBoldFallbackFontFace";
import { fontFamilyFromFamilyName } from "./utils/importExportNames";
import { quoteIfNeeded, updatePropsInFontFace } from "./utils/cssUtils";

import type {
	ParsedFallbackFont,
	ParsedFontFamily,
	GenerateCssInput,
	GenerateCssOutput,
} from "./types";

export const generateCss = async (
	input: GenerateCssInput
): Promise<GenerateCssOutput> => {
	const { families, fontFaceDeclarations, locale, prettifyOutput } = input;

	if (!families || !families.length) {
		throw new Error(
			"@gamesome/core-font: No families provided. Check your configuration!"
		);
	}

	const allFontFamilyDeclarations: { selector: string; fontFamily: string }[] =
		[];
	const allFallbackFontFaceDeclarations: string[] = [];
	const allPreloads: string[] = [];

	for (const family of families as ParsedFontFamily[]) {
		family.imports.forEach((imp) => {
			if (imp.preload.length) {
				const familyDeclarations =
					fontFaceDeclarations[fontFamilyFromFamilyName(family.name)];
				const initialFontFaceDeclaration =
					familyDeclarations && familyDeclarations[imp.name];

				if (!initialFontFaceDeclaration) return;

				const urlBlocks = initialFontFaceDeclaration.match(/url\((.*?)\)/g);
				if (!urlBlocks) return;
				const urls = urlBlocks.map((block) =>
					block.replace(/url\((.*?)\)/, "$1")
				);

				const fileMatchers: string[] = [];
				if (typeof locale === "undefined") {
					imp.preload.forEach((p) => {
						fileMatchers.push(...p.includeFontsMatching);
					});
				} else {
					imp.preload.forEach((p) => {
						if (p.forLocalesMatching) {
							p.forLocalesMatching.forEach((m) => {
								if (new RegExp(m).test(locale)) {
									fileMatchers.push(...p.includeFontsMatching);
								}
							});
						}
					});
				}
				allPreloads.push(
					...urls.filter((url) => {
						const fileName = url.split("/").slice(-1)[0];
						return fileMatchers.some((matcher) => {
							return new RegExp(matcher).test(fileName);
						});
					})
				);
			}
		});

		// Even if there are no fallback, we still need to create a fontFamily. The fallback font families will be added to this later.
		let fontFamilyDeclarations = family.staticFontName;

		if (family.fallbacks) {
			// This function should be in sync with how capsize creates the fallback names: https://github.com/seek-oss/capsize/blob/ac26103410a053428c366c296811976f0746a426/packages/core/src/createFontStack.ts#L170
			const fallbackFamilyName = (fallbackName: string) => {
				return `${family.name} Fallback${
					(family.fallbacks || []).length > 1 ? `: ${fallbackName}` : ""
				}`;
			};

			fontFamilyDeclarations = [
				fontFamilyDeclarations,
				...family.fallbacks.map((f) => fallbackFamilyName(f.name)),
			]
				.map(quoteIfNeeded)
				.join(", ");

			// luckily the order of fontFaceDeclarations matters very little, so we can split the fallbacks into groups depending on how we want to handle them:
			const fallbacksToCalculate: ParsedFallbackFont[] = []; // fallbacks with scaling: true | undefined in options
			const precalculatedFallbacks: ParsedFallbackFont[] = []; // fallbacks with scaling: FontScaling in options
			const fallbacksToSkip: ParsedFallbackFont[] = []; // fallbacks with scaling: false in options

			const fallbackFontFaceDeclarations: string[] = [];

			family.fallbacks.forEach((f) => {
				if (f.scaling === false) {
					fallbacksToSkip.push(f);
				} else if (f.scaling === true) {
					fallbacksToCalculate.push(f);
				} else {
					precalculatedFallbacks.push(f);
				}
			});

			fallbacksToSkip.forEach((fallback) => {
				const fontFamily = quoteIfNeeded(fallbackFamilyName(fallback.name));
				fallbackFontFaceDeclarations.push(`@font-face {
					font-family: ${fontFamily};
					src: local('${fallback.name}');
					font-display: swap;
				}`);
			});

			precalculatedFallbacks.forEach((fallback) => {
				const fontFamily = quoteIfNeeded(fallbackFamilyName(fallback.name));
				const initialFontFace = `@font-face {
					font-family: ${fontFamily};
					src: local('${fallback.name}');
					font-display: swap;
				}`;
				if (!fallback.scaling || typeof fallback.scaling !== "object") {
					throw new Error(
						`@gamesome/core-font: invalid manual scaling for fallback font: ${fallback.name}`
					);
				}
				const fontFace = updatePropsInFontFace(
					initialFontFace,
					fallback.scaling
				);
				fallbackFontFaceDeclarations.push(fontFace);
			});

			if (fallbacksToCalculate.length) {
				const { entireMetricsCollection } = await import(
					"@capsizecss/metrics/entireMetricsCollection"
				);
				const metricsCollection: MetricsCollection = entireMetricsCollection;

				const primaryMetrics = getMetricsCollectionEntry(
					metricsCollection,
					toCC(family.staticFontName),
					`@gamesome/core-font: could not find metrics for primary font, static name: ${family.staticFontName}`
				);
				const fallbackMetrics = fallbacksToCalculate.map((f) => {
					return getMetricsCollectionEntry(
						metricsCollection,
						toCC(f.name),
						`@gamesome/core-font: could not find metrics for fallback font: ${f.name}. use another font, or add scaling props manually.`
					);
				});

				const metrics = [primaryMetrics, ...fallbackMetrics];

				const { fontFaces } = createFontStack(metrics, {
					fontFaceProperties: {
						fontDisplay: "swap",
					},
				});
				// Capsize generates fallback names using the primary font's metrics
				// familyName (e.g. "DM Sans Fallback: Helvetica"), but our CSS rule
				// references family.name (e.g. "DM Sans Variable Fallback: Helvetica").
				// When these differ (variable fonts), fix the font-family values to match.
				let fixedFontFaces = fontFaces;
				if (family.staticFontName !== family.name) {
					const capsizePrefix = `${family.staticFontName} Fallback`;
					const ourPrefix = `${family.name} Fallback`;
					// Only replace inside font-family declarations to avoid
					// accidentally corrupting src: local() or other values.
					fixedFontFaces = fontFaces.replace(
						/font-family:\s*"([^"]+)"/g,
						(match, name) =>
							match.replace(name, name.replace(capsizePrefix, ourPrefix))
					);
				}
				fallbackFontFaceDeclarations.push(fixedFontFaces);

				// Bold fallbacks need their own override calculations because bold glyphs
				// have different widths than regular (e.g. Helvetica Bold is ~7.7% wider).
				const boldCalculatedFallbacks = fallbacksToCalculate.filter(
					(f) => f.bold !== false
				);
				if (boldCalculatedFallbacks.length) {
					fallbackFontFaceDeclarations.push(
						...calculateBoldFallbackFontFaces(
							boldCalculatedFallbacks,
							primaryMetrics,
							metricsCollection,
							fallbackFamilyName,
							toCC
						)
					);
				}
			}

			const ffAsString = fallbackFontFaceDeclarations.join("\n");
			allFallbackFontFaceDeclarations.push(ffAsString);

			// For precalculated/skipped fallbacks we don't have raw metrics to recalculate,
			// so we reuse the existing string manipulation approach for bold variants.
			const nonCalculatedBoldFallbacks = [
				...precalculatedFallbacks,
				...fallbacksToSkip,
			].filter((f) => f.bold !== false);
			if (nonCalculatedBoldFallbacks.length) {
				allFallbackFontFaceDeclarations.push(
					...createBoldFallbackFontFace(nonCalculatedBoldFallbacks, ffAsString)
				);
			}
		}

		if (family.appendFontFamilies) {
			fontFamilyDeclarations = `${fontFamilyDeclarations}, ${family.appendFontFamilies}`;
		}

		if (family.applyFontFamilyToSelector) {
			const ff = fontFamilyDeclarations.replace(
				quoteIfNeeded(family.staticFontName),
				quoteIfNeeded(family.name)
			);
			// We add !important to the font-family declaration to make sure it overrides any other font-family declarations. For example from tailwind.
			const importantSelectors = ["html", ".font-serif", ".font-sans"];
			const ffSuffix = importantSelectors.includes(
				family.applyFontFamilyToSelector
			)
				? " !important"
				: "";
			allFontFamilyDeclarations.push({
				selector: family.applyFontFamilyToSelector,
				fontFamily: `${ff}${ffSuffix}`,
			});
		}
	}

	const css = `${allFontFamilyDeclarations
		.map((declaration) => {
			return `
				${declaration.selector} {
  				font-family: ${declaration.fontFamily};
				}
			`;
		})
		.join("\n")}
		${Object.values(fontFaceDeclarations)
			.map((entry) => {
				return Object.values(entry).join("\n");
			})
			.join("\n")}
		${allFallbackFontFaceDeclarations.join("\n")}
		`;

	return {
		css: new CleanCSS({
			format: prettifyOutput ? "beautify" : false,
		}).minify(css).styles,
		preloads: allPreloads,
	};
};
