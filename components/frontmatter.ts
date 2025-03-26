import initialFontFaceDeclarations from "virtual:gamesome/astro-font-initial-css";
import options from "virtual:gamesome/astro-font-options";

import { createFontStack } from "@capsizecss/core";
import CleanCSS from "clean-css";

// @ts-ignore
import { fontFamilyToCamelCase as toCC } from "@capsizecss/metrics";

import { createBoldFallbackFontFace } from "./createBoldFallbackFontFace";
import { fontFamilyFromFamilyName } from "../utils/importExportNames";
import { quoteIfNeeded, updatePropsInFontFace } from "../utils/cssUtils";

import type { ParsedFallbackFont, ParsedFontFamily } from "../dist/types/types";

export const getCssAndPreloads = async (
	locale?: string
): Promise<{ css: string; preloads: string[] }> => {
	if (
		!(
			options &&
			options.families &&
			options.families.length &&
			(options.families as Array<any>).every(
				(f) =>
					!!f &&
					typeof f === "object" &&
					f.name &&
					f.imports &&
					f.imports.length &&
					f.imports.every((i) => !!i)
			)
		)
	) {
		// NOTE: this will likely never happen, as long as the options parser (normaliseOptions.ts) throws.
		throw new Error(
			"@gamesome/astro-font: No options or options.families option provided. Check your astro.config!"
		);
	}

	const allFontFamilyDeclarations: { selector: string; fontFamily: string }[] =
		[];
	const allFallbackFontFaceDeclarations: string[] = [];
	const allPreloads: string[] = [];

	for (const family of options.families as ParsedFontFamily[]) {
		family.imports.forEach((imp) => {
			if (imp.preload.length) {
				const initialFontFaceDeclaration =
					initialFontFaceDeclarations[fontFamilyFromFamilyName(family.name)][
						imp.name
					];

				const urlBlocks = initialFontFaceDeclaration.match(/url\((.*?)\)/g);
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
			const fallbacksToCalculate: ParsedFallbackFont[] = []; // fallbacks with scaling: true | undefined in options
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
				const fontFace = updatePropsInFontFace(
					initialFontFace,
					fallback.scaling as Record<string, string>
				);
				fallbackFontFaceDeclarations.push(fontFace);
			});

			if (fallbacksToCalculate.length) {
				// @ts-ignore
				const { entireMetricsCollection } = await import(
					"@capsizecss/metrics/entireMetricsCollection/dist/capsizecss-metrics-entireMetricsCollection.cjs.js"
				);

				const primaryMetrics =
					entireMetricsCollection[toCC(family.staticFontName)];
				if (!primaryMetrics) {
					throw new Error(
						`@gamesome/astro-font: could not find metrics for primary font, static name: ${family.staticFontName}`
					);
				}
				const fallbackMetrics = fallbacksToCalculate.map((f) => {
					const metric = entireMetricsCollection[toCC(f.name)];
					if (!metric) {
						throw new Error(
							`@gamesome/astro-font: could not find metrics for fallback font: ${f.name}. use another font, or add scaling props manually.`
						);
					}
					return metric;
				});

				const metrics = [primaryMetrics, ...fallbackMetrics];

				const { fontFaces } = createFontStack(metrics, {
					fontFaceProperties: {
						fontDisplay: "swap",
					},
				});
				fallbackFontFaceDeclarations.push(fontFaces);
			}
			// we want to add one additional block for each fallback font, representing the bold variants.
			// we do this by changing the string in local() to the bold variant and add font-weight: accodring to the config.
			const ffAsString = fallbackFontFaceDeclarations.join("\n");
			allFallbackFontFaceDeclarations.push(ffAsString);
			allFallbackFontFaceDeclarations.push(
				...createBoldFallbackFontFace(
					family.fallbacks.filter((f) => f.bold !== false),
					ffAsString
				)
			);
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
		${Object.values(initialFontFaceDeclarations).map((entry) => {
			return Object.values(entry).join("\n");
		})}
		${allFallbackFontFaceDeclarations.join("\n")}
		`;

	return {
		css: new CleanCSS({
			format: options.prettifyOutput ? "beautify" : false,
		}).minify(css).styles,
		preloads: allPreloads,
	};
};
