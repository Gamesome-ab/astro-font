import { styleNameFromCssImport } from "./utils/importExportNames";

import type {
	ParsedFallbackFont,
	ParsedFontFamily,
	ParsedFontImport,
	ParsedPreloadConfig,
} from "types";
import type { FontImport, FallbackFont, FontFamily } from "index";

const _variableFontNameToFontName = (variableFontName: string) => {
	return variableFontName.replace(" Variable", "");
};

const _parsedStaticFontName = (staticName: string, name: string) => {
	if (staticName) {
		return staticName;
	}
	return _variableFontNameToFontName(name);
};

export const _parsedType = (type: FontFamily["type"]) => {
	if (typeof type === "undefined") {
		return "sans-serif";
	} else if (type === "sans-serif" || type === "serif" || type === "mono") {
		return type;
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font family with an invalid type (should be sans-serif, serif or mono). ${JSON.stringify(
				type
			)}`
		);
	}
};

export const _parsedPreloads = (
	preloads: FontImport["preload"],
	firstFontFile?: boolean
) => {
	const defaultPreloads = [
		{
			includeFontsMatching: ["latin(?!-ext)"],
			forLocalesMatching: [".+"],
		},
	] as ParsedPreloadConfig[];
	if (typeof preloads === "undefined") {
		if (firstFontFile) {
			return defaultPreloads;
		}
		return [];
	} else if (typeof preloads === "boolean") {
		return preloads ? defaultPreloads : [];
	} else if (preloads && Array.isArray(preloads)) {
		return preloads.map((p) => {
			if (
				p.includeFontsMatching &&
				Array.isArray(p.includeFontsMatching) &&
				p.includeFontsMatching.every((f) => typeof f === "string") &&
				(p.forLocalesMatching === undefined ||
					p.forLocalesMatching.every((f) => typeof f === "string"))
			) {
				return {
					includeFontsMatching: p.includeFontsMatching,
					forLocalesMatching:
						p.forLocalesMatching || defaultPreloads[0].forLocalesMatching,
				};
			} else {
				throw new Error(
					`@gamesome/astro-font encounterd an invalid list of preloads (string[]). ${JSON.stringify(
						preloads
					)}`
				);
			}
		});
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font import with an invalid preload (should be array of Preload, undefined or boolean). ${JSON.stringify(
				preloads
			)}`
		);
	}
};

export const _parsedFontImport = (
	imp: string | FontImport,
	first?: boolean
) => {
	let i: Partial<ParsedFontImport>;
	if (typeof imp === "string") {
		i = {
			name: styleNameFromCssImport(imp),
			css: imp,
			preload: _parsedPreloads(undefined, first),
		};
	} else if (imp && imp.css) {
		i = {
			name: styleNameFromCssImport(imp.css),
			css: imp.css,
			preload: _parsedPreloads(imp.preload, first),
		};
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font import without css import statement, or it could not be parsed: ${JSON.stringify(
				imp
			)}`
		);
	}

	return i as ParsedFontImport;
};

export const _parsedFallbackFont = (inp: FallbackFont | string) => {
	let f: FallbackFont;
	if (typeof inp === "string") {
		f = { name: inp };
	} else {
		f = inp;
	}

	if (!f.name) {
		throw new Error(
			`@gamesome/astro-font encounterd a fallback font without a name. ${JSON.stringify(
				f
			)}`
		);
	}

	const fallbackFont = { name: f.name } as ParsedFallbackFont;

	const defaultBold = {
		suffix: "Bold",
		weight: "bold",
	};
	if (typeof f.bold === "undefined") {
		fallbackFont.bold = defaultBold;
	} else if (f.bold === false) {
		fallbackFont.bold = false;
	} else if (
		f.bold &&
		(typeof f.bold.suffix === "string" ||
			typeof f.bold.weight === "string" ||
			typeof f.bold.weight === "number")
	) {
		fallbackFont.bold = {
			...f.bold,
			suffix: f.bold.suffix.trim() || defaultBold.suffix,
			weight: f.bold.weight || defaultBold.weight,
		};
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a fallback font with an invalid bold configuration (should be object with suffix and weight, undefined or false). ${JSON.stringify(
				f
			)}`
		);
	}

	if (typeof f.scaling === "undefined") {
		fallbackFont.scaling = true;
	} else if (f.scaling === false) {
		fallbackFont.scaling = false;
	} else if (
		f.scaling &&
		typeof f.scaling === "object" &&
		Object.keys(f.scaling)
			.map((k) =>
				[
					"ascentOverride",
					"descentOverride",
					"sizeAdjust",
					"lineGapOverride",
				].includes(k)
			)
			.every((k) => k)
	) {
		fallbackFont.scaling = f.scaling;
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a fallback font with an invalid scaling (should be object, undefined or false). ${JSON.stringify(
				f
			)}`
		);
	}

	return fallbackFont;
};

export const _parsedFallbacks = (
	fallbacks: FontFamily["fallbacks"],
	type: FontFamily["type"]
) => {
	if (typeof fallbacks === "undefined") {
		if (type === "sans-serif") {
			return ["Helvetica", "Helvetica Neue", "Arial"].map(_parsedFallbackFont);
		}
		if (type === "serif") {
			return ["Georgia", "Times New Roman"].map(_parsedFallbackFont);
		}
		if (type === "mono") {
			return ["Menlo", "Monaco", "Courier New"].map(_parsedFallbackFont);
		}
	} else if (fallbacks === false) {
		return false;
	} else if (
		Array.isArray(fallbacks) &&
		fallbacks.length &&
		fallbacks.every((f) => typeof f === "string" || typeof f === "object")
	) {
		return fallbacks.map(_parsedFallbackFont);
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font family with an invalid fallbacks (should be (FallbackFont | string)[], undefined or false). ${JSON.stringify(
				fallbacks
			)}`
		);
	}
};

export const _parsedAppendFontFamilies = (
	appended: FontFamily["appendFontFamilies"],
	type: FontFamily["type"]
) => {
	if (typeof appended === "undefined") {
		if (type === "sans-serif") {
			return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
		}
		if (type === "serif") {
			return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
		}
		if (type === "mono") {
			return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
		}
	} else if (typeof appended === "string") {
		return appended;
	} else if (appended === false) {
		return false;
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font family with an invalid appendFontFamilies (should be string, undefined or false). ${JSON.stringify(
				appended
			)}`
		);
	}
};

export const _parsedSelector = (
	selector: FontFamily["applyFontFamilyToSelector"],
	first: boolean
) => {
	if (typeof selector === "undefined" && first) {
		return "html";
	} else if (typeof selector === "string") {
		return selector;
	} else if (selector === false) {
		return false;
	} else {
		throw new Error(
			`@gamesome/astro-font encounterd a font family with an invalid applyFontFamilyToSelector (should be string or false. undefined is allowed only for the first family). ${JSON.stringify(
				selector
			)}`
		);
	}
};

export const _parsedFamily = (f: Partial<FontFamily>, first: boolean) => {
	if (!(f.name && f.imports && f.imports.length)) {
		throw new Error(
			`@gamesome/astro-font encounterd a font family without: name, type or imports. ${JSON.stringify(
				f
			)}`
		);
	}

	const type = _parsedType(f.type);

	const family = {
		name: f.name,
		staticFontName: _parsedStaticFontName(f.staticFontName, f.name),
		type: type,
		imports: f.imports.map((imp, i) => _parsedFontImport(imp, i === 0)),
		fallbacks: _parsedFallbacks(f.fallbacks, type),
		appendFontFamilies: _parsedAppendFontFamilies(f.appendFontFamilies, type),
		applyFontFamilyToSelector: _parsedSelector(
			f.applyFontFamilyToSelector,
			first
		),
	} as ParsedFontFamily;

	return family;
};

export const parsedFamilies = (families: FontFamily[]) => {
	if (!families.length) {
		throw new Error(
			`@gamesome/astro-font: you must specify at least one font family.`
		);
	}

	if (
		!families
			.slice(1)
			.every((f) => typeof f.applyFontFamilyToSelector !== "undefined")
	) {
		throw new Error(
			`@gamesome/astro-font: you must specify applyFontFamilyToSelector for every font family after the first.`
		);
	}

	return families.map((f, i) => _parsedFamily(f, i === 0));
};
