import { quoteIfNeeded, updatePropsInFontFace } from "./utils/cssUtils";
import type { FontScaling, ParsedFallbackFont } from "./types";

// Capsize variant entries may omit fields like capHeight and xHeight,
// so we only require the fields we actually need for override calculations.
interface OverrideMetrics {
	familyName?: string;
	ascent: number;
	descent: number;
	lineGap: number;
	unitsPerEm: number;
	xWidthAvg: number;
	subsets?: Record<string, { xWidthAvg: number }>;
}

export interface MetricsWithVariants extends OverrideMetrics {
	familyName: string;
	fullName?: string;
	postscriptName?: string;
	variants?: Record<string, OverrideMetrics>;
}

export type MetricsCollection =
	typeof import("@capsizecss/metrics/entireMetricsCollection").entireMetricsCollection;

const isMetricsWithVariants = (
	value: unknown
): value is MetricsWithVariants => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const metrics = value as Partial<OverrideMetrics> & { familyName?: unknown };

	return (
		typeof metrics.familyName === "string" &&
		typeof metrics.ascent === "number" &&
		typeof metrics.descent === "number" &&
		typeof metrics.lineGap === "number" &&
		typeof metrics.unitsPerEm === "number" &&
		typeof metrics.xWidthAvg === "number"
	);
};

export const getMetricsCollectionEntry = (
	metricsCollection: MetricsCollection,
	metricName: string,
	errorMessage: string
): MetricsWithVariants => {
	const metrics = metricsCollection[metricName];

	if (!isMetricsWithVariants(metrics)) {
		throw new Error(errorMessage);
	}

	return metrics;
};

const round = (value: number) => parseFloat(value.toFixed(4));
const toPercentString = (value: number) => `${round(value * 100)}%`;

const resolveXWidthAvg = (metrics: OverrideMetrics, subset = "latin") => {
	if (metrics.subsets?.[subset]) {
		return metrics.subsets[subset].xWidthAvg;
	}

	if (subset !== "latin") {
		throw new Error(
			`@gamesome/core-font: Capsize metrics for "${
				metrics.familyName || "unknown font"
			}" do not include the subset "${subset}".`
		);
	}

	return metrics.xWidthAvg;
};

const resolveWeightKey = (weight: string | number) => {
	const weightStr = String(weight).trim();

	if (weightStr === "bold") {
		return "700";
	}

	if (/^\d+$/.test(weightStr)) {
		return weightStr;
	}

	throw new Error(
		`@gamesome/core-font: automatic bold fallback scaling only supports numeric bold.weight values or \"bold\". Received \"${weightStr}\". Use bold.scaling to provide manual override values, change bold.weight to 700, or set bold to false.`
	);
};

const getVariantMetrics = (
	metrics: MetricsWithVariants,
	weightKey: string,
	context: string
) => {
	const variantMetrics = metrics.variants?.[weightKey];

	if (variantMetrics) {
		return variantMetrics;
	}

	if (weightKey === "700") {
		return metrics;
	}

	throw new Error(
		`@gamesome/core-font: could not find Capsize variant metrics for bold.weight ${weightKey} on ${context}. Automatic bold fallback scaling only works for weights that exist in Capsize's variants data. Use bold.scaling to provide manual override values, change bold.weight to 700, or set bold to false.`
	);
};

// Capsize doesn't export calculateOverrideValues, so we replicate it here.
// Must stay in sync with: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts
const calculateOverrideValues = (
	primaryMetrics: OverrideMetrics,
	fallbackMetrics: OverrideMetrics,
	subset = "latin"
): FontScaling => {
	const preferredFontXAvgRatio =
		resolveXWidthAvg(primaryMetrics, subset) / primaryMetrics.unitsPerEm;
	const fallbackFontXAvgRatio =
		resolveXWidthAvg(fallbackMetrics, subset) / fallbackMetrics.unitsPerEm;
	const sizeAdjust =
		preferredFontXAvgRatio && fallbackFontXAvgRatio
			? preferredFontXAvgRatio / fallbackFontXAvgRatio
			: 1;

	const adjustedEmSquare = primaryMetrics.unitsPerEm * sizeAdjust;

	const ascentOverride = primaryMetrics.ascent / adjustedEmSquare;
	const descentOverride = Math.abs(primaryMetrics.descent) / adjustedEmSquare;
	const lineGapOverride = primaryMetrics.lineGap / adjustedEmSquare;

	const fallbackAscentOverride = fallbackMetrics.ascent / adjustedEmSquare;
	const fallbackDescentOverride =
		Math.abs(fallbackMetrics.descent) / adjustedEmSquare;
	const fallbackLineGapOverride = fallbackMetrics.lineGap / adjustedEmSquare;

	// Capsize only emits overrides that differ from the fallback's native values.
	const result: FontScaling = {};
	if (ascentOverride && ascentOverride !== fallbackAscentOverride) {
		result.ascentOverride = toPercentString(ascentOverride);
	}
	if (descentOverride && descentOverride !== fallbackDescentOverride) {
		result.descentOverride = toPercentString(descentOverride);
	}
	if (lineGapOverride !== fallbackLineGapOverride) {
		result.lineGapOverride = toPercentString(lineGapOverride);
	}
	if (sizeAdjust && sizeAdjust !== 1) {
		result.sizeAdjust = toPercentString(sizeAdjust);
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
	metricsCollection: MetricsCollection,
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
		const weightKey = resolveWeightKey(weight);

		// Both the primary and fallback need bold variant metrics. For the primary
		// (often a variable font), Capsize's variants["700"] comes from the static
		// bold cut, which shares the same masters and metrics as the variable font
		// at wght=700. For the fallback, it represents the actual system bold font
		// (e.g. "Georgia Bold") that the browser will use.
		const primaryBoldMetrics = getVariantMetrics(
			primaryMetrics,
			weightKey,
			`primary font \"${primaryMetrics.familyName}\"`
		);
		const fallbackCollection = getMetricsCollectionEntry(
			metricsCollection,
			toCC(fallback.name),
			`@gamesome/core-font: could not find metrics for fallback font: ${fallback.name}. use another font, or add scaling props manually.`
		);
		const fallbackBoldMetrics = getVariantMetrics(
			fallbackCollection,
			weightKey,
			`fallback font \"${fallback.name}\"`
		);

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
			fontFace = updatePropsInFontFace(fontFace, bold.scaling);
		}

		declarations.push(fontFace);
	}

	return declarations;
};
