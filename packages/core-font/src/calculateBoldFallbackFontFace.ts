import { quoteIfNeeded, updatePropsInFontFace } from "./utils/cssUtils";
import type { ParsedFallbackFont } from "./types";

// Capsize variant entries may omit fields like capHeight and xHeight,
// so we only require the fields we actually need for override calculations.
interface OverrideMetrics {
	ascent: number;
	descent: number;
	lineGap: number;
	unitsPerEm: number;
	xWidthAvg: number;
}

export interface MetricsWithVariants extends OverrideMetrics {
	familyName: string;
	fullName?: string;
	postscriptName?: string;
	variants?: Record<string, OverrideMetrics>;
}

const round = (value: number) => parseFloat(value.toFixed(4));
const toPercentString = (value: number) => `${round(value * 100)}%`;

// Capsize doesn't export calculateOverrideValues, so we replicate it here.
// Must stay in sync with: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts
const calculateOverrideValues = (
	primaryMetrics: OverrideMetrics,
	fallbackMetrics: OverrideMetrics
) => {
	const preferredFontXAvgRatio =
		primaryMetrics.xWidthAvg / primaryMetrics.unitsPerEm;
	const fallbackFontXAvgRatio =
		fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;
	const sizeAdjust =
		preferredFontXAvgRatio && fallbackFontXAvgRatio
			? preferredFontXAvgRatio / fallbackFontXAvgRatio
			: 1;

	const adjustedEmSquare = primaryMetrics.unitsPerEm * sizeAdjust;

	const ascentOverride = primaryMetrics.ascent / adjustedEmSquare;
	const descentOverride =
		Math.abs(primaryMetrics.descent) / adjustedEmSquare;
	const lineGapOverride = primaryMetrics.lineGap / adjustedEmSquare;

	const fallbackAscentOverride = fallbackMetrics.ascent / adjustedEmSquare;
	const fallbackDescentOverride =
		Math.abs(fallbackMetrics.descent) / adjustedEmSquare;
	const fallbackLineGapOverride = fallbackMetrics.lineGap / adjustedEmSquare;

	// Capsize only emits overrides that differ from the fallback's native values.
	const result: Record<string, string> = {};
	if (ascentOverride && ascentOverride !== fallbackAscentOverride) {
		result["ascent-override"] = toPercentString(ascentOverride);
	}
	if (descentOverride && descentOverride !== fallbackDescentOverride) {
		result["descent-override"] = toPercentString(descentOverride);
	}
	if (lineGapOverride !== fallbackLineGapOverride) {
		result["line-gap-override"] = toPercentString(lineGapOverride);
	}
	if (sizeAdjust && sizeAdjust !== 1) {
		result["size-adjust"] = toPercentString(sizeAdjust);
	}

	return result;
};

// We can't use Capsize's createFontStack for bold because it would generate
// font-family names and local() sources based on the bold variant's metadata
// (e.g. "Helvetica Bold" as familyName), but we need them to match the
// regular fallback's naming scheme. So we calculate overrides ourselves and
// construct the @font-face block directly.
export const calculateBoldFallbackFontFaces = (
	fallbacks: ParsedFallbackFont[],
	primaryMetrics: MetricsWithVariants,
	metricsCollection: Record<string, MetricsWithVariants>,
	fallbackFamilyName: (name: string) => string,
	toCC: (name: string) => string
): string[] => {
	const declarations: string[] = [];

	for (const fallback of fallbacks) {
		if (fallback.bold === false) continue;

		const bold = fallback.bold;
		const weight = bold.weight || "700";
		const boldLocalName = `${fallback.name} ${bold.suffix}`;
		const fontFamily = quoteIfNeeded(fallbackFamilyName(fallback.name));

		// Capsize variant keys are numeric strings ("700", "500"), not CSS keywords.
		// If weight is already numeric (number or numeric string), use it directly.
		// Otherwise (e.g. "bold"), default to "700".
		const weightStr = String(weight);
		const weightKey = /^\d+$/.test(weightStr) ? weightStr : "700";

		// Both the primary and fallback need bold variant metrics. For the primary
		// (often a variable font), Capsize's variants["700"] comes from the static
		// bold cut, which shares the same masters and metrics as the variable font
		// at wght=700. For the fallback, it represents the actual system bold font
		// (e.g. "Georgia Bold") that the browser will use.
		const primaryBoldMetrics =
			primaryMetrics.variants?.[weightKey] || primaryMetrics;
		const fallbackCollection = metricsCollection[toCC(fallback.name)];
		const fallbackBoldMetrics =
			fallbackCollection?.variants?.[weightKey] || fallbackCollection;

		const overrides = calculateOverrideValues(
			primaryBoldMetrics,
			fallbackBoldMetrics
		);

		let fontFace = `@font-face {
  font-family: ${fontFamily};
  src: local('${boldLocalName}');
  font-display: swap;
  font-weight: ${weight};
}`;

		fontFace = updatePropsInFontFace(fontFace, overrides);

		// User-specified bold.scaling overrides take precedence over calculated values.
		if (bold.scaling) {
			fontFace = updatePropsInFontFace(
				fontFace,
				bold.scaling as Record<string, string>
			);
		}

		declarations.push(fontFace);
	}

	return declarations;
};
