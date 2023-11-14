import { describe, it, assert } from "vitest";
import {
	_parsedAppendFontFamilies,
	_parsedFallbackFont,
	_parsedFallbacks,
	_parsedFontImport,
	_parsedPreloads,
	_parsedSelector,
} from "../normaliseOptions";

describe("_parsedPreloads", () => {
	it("should return default preloads if preloads is undefined and firstFontFile is true", () => {
		const preloads = _parsedPreloads(undefined, true);
		assert.deepEqual(preloads, [
			{
				includeFontsMatching: ["latin(?!-ext)"],
				forLocalesMatching: [".+"],
			},
		]);
	});

	it("should return an empty array if preloads is undefined and firstFontFile is false", () => {
		const preloads = _parsedPreloads(undefined, false);
		assert.deepEqual(preloads, []);
	});

	it("should return an empty array if preloads is false", () => {
		const preloads = _parsedPreloads(false, true);
		assert.deepEqual(preloads, []);
	});

	it("should return default preloads if preloads is true and firstFontFile is true", () => {
		const preloads = _parsedPreloads(true, true);
		assert.deepEqual(preloads, [
			{
				includeFontsMatching: ["latin(?!-ext)"],
				forLocalesMatching: [".+"],
			},
		]);
	});

	it("should return an empty array if preloads is false and firstFontFile is true", () => {
		const preloads = _parsedPreloads(false, true);
		assert.deepEqual(preloads, []);
	});

	it("should throw an error if preloads is not an array, undefined, or boolean", () => {
		assert.throws(
			() => _parsedPreloads("invalid" as any, true),
			/@gamesome\/astro-font encounterd a font import with an invalid preload/
		);
	});

	it("should throw an error if preloads is an array but contains invalid elements", () => {
		assert.throws(
			() =>
				_parsedPreloads(
					["valid", { includeFontsMatching: "invalid" }, 123] as any,
					true
				),
			/@gamesome\/astro-font encounterd an invalid list of preloads/
		);
	});

	it("should parse an array of preloads", () => {
		const preloads = _parsedPreloads(
			[
				{
					includeFontsMatching: ["latin"],
					forLocalesMatching: ["en-US"],
				},
				{
					includeFontsMatching: ["cyrillic(-ext)?"],
					forLocalesMatching: ["^ru"],
				},
			],
			true
		);
		assert.deepEqual(preloads, [
			{
				includeFontsMatching: ["latin"],
				forLocalesMatching: ["en-US"],
			},
			{
				includeFontsMatching: ["cyrillic(-ext)?"],
				forLocalesMatching: ["^ru"],
			},
		]);
	});
});

describe("_parsedFontImport", () => {
	it("should throw an error if import is not a string or object", () => {
		assert.throws(
			() => _parsedFontImport(null as any),
			/@gamesome\/astro-font encounterd a font import without css import statement, or it could not be parsed/
		);
	});

	it("should throw an error if import object is missing name or css", () => {
		assert.throws(
			() => _parsedFontImport({} as any),
			/@gamesome\/astro-font encounterd a font import without css import statement, or it could not be parsed/
		);
	});

	it("should parse first string import into an object with name, css and some preload", () => {
		const fontImport = _parsedFontImport(
			"@fontsource-variable/rubik/wght-italic.css",
			true
		);
		assert.equal(fontImport.name, "rubik_wght_italic");
		assert.equal(fontImport.css, "@fontsource-variable/rubik/wght-italic.css");
		assert.isArray(fontImport.preload);
		assert.equal(fontImport.preload.length, 1);
	});

	it("should parse non-first string import into an object with name, css and emtpy preload", () => {
		const fontImport = _parsedFontImport(
			"@fontsource-variable/rubik/wght-italic.css"
		);
		assert.deepEqual(fontImport, {
			name: "rubik_wght_italic",
			css: "@fontsource-variable/rubik/wght-italic.css",
			preload: [],
		});
	});
});

describe("_parsedFallbackFont", () => {
	it("should throw an error if fallback font has no name", () => {
		assert.throws(
			() => _parsedFallbackFont({} as any),
			/fallback font without a name/
		);
	});

	it("should set default bold values if not provided", () => {
		const fallbackFont = _parsedFallbackFont({ name: "Test Font" });
		assert.deepEqual(fallbackFont.bold, { suffix: "Bold", weight: "bold" });
	});

	it("should set bold to false if provided as false", () => {
		const fallbackFont = _parsedFallbackFont({
			name: "Test Font",
			bold: false,
		});
		assert.equal(fallbackFont.bold, false);
	});

	it("should throw an error if bold is not an object, undefined, or false", () => {
		assert.throws(
			() => _parsedFallbackFont({ name: "Test Font", bold: "invalid" } as any),
			/fallback font with an invalid bold configuration/
		);
	});

	it("should set props for bold if provided", () => {
		const fallbackFont = _parsedFallbackFont({
			name: "Test Font",
			bold: {
				suffix: "Bold",
				weight: 700,
			},
		});
		assert.deepEqual(fallbackFont.bold, {
			suffix: "Bold",
			weight: 700,
		});
	});

	it("should set scaling to true if not provided (on non-bold font)", () => {
		// This indicates that scaling calculations should be performed.
		const fallbackFont = _parsedFallbackFont({ name: "Test Font" });
		assert.equal(fallbackFont.scaling, true);
	});

	it("should set scaling to false if provided as false", () => {
		const fallbackFont = _parsedFallbackFont({
			name: "Test Font",
			scaling: false,
		});
		assert.equal(fallbackFont.scaling, false);
	});

	it("should throw an error if scaling is not an object, undefined, or false", () => {
		assert.throws(
			() =>
				_parsedFallbackFont({ name: "Test Font", scaling: "invalid" } as any),
			/fallback font with an invalid scaling/
		);
	});

	it("should set scaling to provided object if valid", () => {
		const fallbackFont = _parsedFallbackFont({
			name: "Test Font",
			scaling: {
				ascentOverride: "100%",
				descentOverride: "20%",
				sizeAdjust: "95%",
				lineGapOverride: "20%",
			},
		});
		assert.deepEqual(fallbackFont.scaling, {
			ascentOverride: "100%",
			descentOverride: "20%",
			sizeAdjust: "95%",
			lineGapOverride: "20%",
		});
	});
});

describe("_parsedFallbacks", () => {
	const boldAndScalingProps = {
		bold: {
			suffix: "Bold",
			weight: "bold",
		},
		scaling: true,
	};
	it("should return default fallbacks for sans-serif type", () => {
		const fallbacks = _parsedFallbacks(undefined, "sans-serif");
		assert.deepEqual(fallbacks, [
			{ name: "Helvetica", ...boldAndScalingProps },
			{ name: "Helvetica Neue", ...boldAndScalingProps },
			{ name: "Arial", ...boldAndScalingProps },
		]);
	});

	it("should return default fallbacks for serif type", () => {
		const fallbacks = _parsedFallbacks(undefined, "serif");
		assert.deepEqual(fallbacks, [
			{ name: "Georgia", ...boldAndScalingProps },
			{ name: "Times New Roman", ...boldAndScalingProps },
		]);
	});

	it("should return default fallbacks for mono type", () => {
		const fallbacks = _parsedFallbacks(undefined, "mono");
		assert.deepEqual(fallbacks, [
			{ name: "Menlo", ...boldAndScalingProps },
			{ name: "Monaco", ...boldAndScalingProps },
			{ name: "Courier New", ...boldAndScalingProps },
		]);
	});

	it("should return false if fallbacks is false", () => {
		const fallbacks = _parsedFallbacks(false, "sans-serif");
		assert.equal(fallbacks, false);
	});

	it("should throw an error if fallbacks is just a string", () => {
		assert.throws(
			() => _parsedFallbacks("invalid" as any, "sans-serif"),
			/@gamesome\/astro-font encounterd a font family with an invalid fallbacks/
		);
	});

	it("should throw an error if fallbacks is an array but contains invalid elements", () => {
		assert.throws(
			() =>
				_parsedFallbacks(
					["valid", { name: "valid" }, 123] as any,
					"sans-serif"
				),
			/@gamesome\/astro-font encounterd a font family with an invalid fallbacks/
		);
	});

	it("should parse an array of fallbacks", () => {
		const fallbacks = _parsedFallbacks(
			[
				"Helvetica",
				{ name: "Arial", bold: false },
				{ name: "Roboto", scaling: false },
			],
			"sans-serif"
		);
		assert.deepEqual(fallbacks, [
			{ name: "Helvetica", ...boldAndScalingProps },
			{ name: "Arial", ...boldAndScalingProps, bold: false },
			{ name: "Roboto", ...boldAndScalingProps, scaling: false },
		]);
	});
});

describe("_parsedAppendFontFamilies", () => {
	it("should return default append font families for sans-serif type", () => {
		const appendFontFamilies = _parsedAppendFontFamilies(
			undefined,
			"sans-serif"
		);
		assert.equal(
			appendFontFamilies,
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
		);
	});

	it("should return default append font families for serif type", () => {
		const appendFontFamilies = _parsedAppendFontFamilies(undefined, "serif");
		assert.equal(
			appendFontFamilies,
			'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
		);
	});

	it("should return default append font families for mono type", () => {
		const appendFontFamilies = _parsedAppendFontFamilies(undefined, "mono");
		assert.equal(
			appendFontFamilies,
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
		);
	});

	it("should return false if appendFontFamilies is false", () => {
		const appendFontFamilies = _parsedAppendFontFamilies(false, "sans-serif");
		assert.equal(appendFontFamilies, false);
	});

	it("should throw an error if appendFontFamilies is not a string, undefined, or false", () => {
		assert.throws(
			() => _parsedAppendFontFamilies(["invalid"] as any, "sans-serif"),
			/@gamesome\/astro-font encounterd a font family with an invalid appendFontFamilies/
		);
	});
});

describe("_parsedSelector", () => {
	it("should return 'html' if selector is undefined", () => {
		const result = _parsedSelector(undefined, true);
		assert.equal(result, "html");
	});

	it("should return the selector string if selector is a string", () => {
		const result = _parsedSelector(".my-selector", true);
		assert.equal(result, ".my-selector");
	});

	it("should return false if selector is false", () => {
		const result = _parsedSelector(false, true);
		assert.equal(result, false);
	});

	it("should throw an error if selector is not a string, undefined, or false", () => {
		assert.throws(
			() => _parsedSelector(123 as any, true),
			/@gamesome\/astro-font encounterd a font family with an invalid applyFontFamilyToSelector/
		);
	});

	it("should throw an error if selector is undefined and first is false", () => {
		assert.throws(
			() => _parsedSelector(undefined, false),
			/@gamesome\/astro-font encounterd a font family with an invalid applyFontFamilyToSelector/
		);
	});
});
