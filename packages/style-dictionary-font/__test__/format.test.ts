import { describe, it, expect } from "vitest";
import { extractFontFamiliesFromTokens } from "../src/tokenHelpers";
import { buildFontFaceDeclarations } from "../src/format";

describe("extractFontFamiliesFromTokens", () => {
	it("should extract font families from tokens with gamesome.font extensions", () => {
		const tokens = {
			font: {
				family: {
					primary: {
						value: "Rubik Variable",
						type: "fontFamily",
						$extensions: {
							"gamesome.font": {
								fontType: "sans-serif",
								imports: ["@fontsource-variable/rubik/wght.css"],
							},
						},
					},
				},
			},
		};

		const families = extractFontFamiliesFromTokens(tokens);
		expect(families).toHaveLength(1);
		expect(families[0].name).toBe("Rubik Variable");
		expect(families[0].type).toBe("sans-serif");
		expect(families[0].imports).toEqual([
			"@fontsource-variable/rubik/wght.css",
		]);
	});

	it("should extract multiple font families", () => {
		const tokens = {
			font: {
				family: {
					primary: {
						value: "Rubik Variable",
						type: "fontFamily",
						$extensions: {
							"gamesome.font": {
								imports: ["@fontsource-variable/rubik/wght.css"],
							},
						},
					},
					secondary: {
						value: "Georgia",
						type: "fontFamily",
						$extensions: {
							"gamesome.font": {
								fontType: "serif",
								imports: ["@fontsource/georgia/400.css"],
								applyFontFamilyToSelector: ".font-serif",
							},
						},
					},
				},
			},
		};

		const families = extractFontFamiliesFromTokens(tokens);
		expect(families).toHaveLength(2);
		expect(families[1].type).toBe("serif");
		expect(families[1].applyFontFamilyToSelector).toBe(".font-serif");
	});

	it("should extract object-based applyFontFamilyToSelector configs", () => {
		const tokens = {
			font: {
				family: {
					primary: {
						value: "Rubik Variable",
						type: "fontFamily",
						$extensions: {
							"gamesome.font": {
								imports: ["@fontsource-variable/rubik/wght.css"],
								applyFontFamilyToSelector: {
									selector: ".font-sans",
									cssVariable: "--font-sans",
								},
							},
						},
					},
				},
			},
		};

		const families = extractFontFamiliesFromTokens(tokens);
		expect(families[0].applyFontFamilyToSelector).toEqual({
			selector: ".font-sans",
			cssVariable: "--font-sans",
		});
	});

	it("should return empty array when no gamesome.font tokens exist", () => {
		const tokens = {
			color: {
				primary: {
					value: "#ff0000",
				},
			},
		};

		const families = extractFontFamiliesFromTokens(tokens);
		expect(families).toHaveLength(0);
	});

	it("should handle fallbacks and other optional properties", () => {
		const tokens = {
			font: {
				main: {
					value: "DM Sans Variable",
					type: "fontFamily",
					$extensions: {
						"gamesome.font": {
							imports: ["@fontsource-variable/dm-sans/wght.css"],
							fallbacks: ["Helvetica", "Arial"],
							appendFontFamilies: "sans-serif",
							staticFontName: "DM Sans",
						},
					},
				},
			},
		};

		const families = extractFontFamiliesFromTokens(tokens);
		expect(families[0].fallbacks).toEqual(["Helvetica", "Arial"]);
		expect(families[0].appendFontFamilies).toBe("sans-serif");
		expect(families[0].staticFontName).toBe("DM Sans");
	});
});

describe("buildFontFaceDeclarations", () => {
	it("should build declarations map from families and CSS contents", () => {
		const families = [
			{
				name: "Rubik Variable",
				imports: [
					"@fontsource-variable/rubik/wght.css",
					"@fontsource-variable/rubik/wght-italic.css",
				],
			},
		];

		const cssContents = {
			"@fontsource-variable/rubik/wght.css": "@font-face { /* wght */ }",
			"@fontsource-variable/rubik/wght-italic.css":
				"@font-face { /* wght-italic */ }",
		};

		const declarations = buildFontFaceDeclarations(families, cssContents);
		expect(declarations.rubik_variable).toBeDefined();
		expect(declarations.rubik_variable.rubik_wght).toBe(
			"@font-face { /* wght */ }"
		);
		expect(declarations.rubik_variable.rubik_wght_italic).toBe(
			"@font-face { /* wght-italic */ }"
		);
	});
});
