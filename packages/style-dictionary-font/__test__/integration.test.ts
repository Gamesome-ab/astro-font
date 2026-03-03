import { describe, it, expect, beforeAll } from "vitest";
import StyleDictionary from "style-dictionary";
import fs from "fs";
import path from "path";
import { gamesomeFontFaceFormat, buildFontFaceDeclarations } from "../src/format";

// Read the rubik fixture CSS from core-font's test fixtures
const fixturesDir = path.join(__dirname, "../../core-font/__test__/fixtures/rubik");
const rubikWghtCss = fs.readFileSync(path.join(fixturesDir, "wght.css"), "utf-8");

const cssContents: Record<string, string> = {
	"@fontsource-variable/rubik/wght.css": rubikWghtCss,
};

describe("style-dictionary integration", () => {
	it("should generate valid CSS through the SD format pipeline", async () => {
		// Register the format
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		// Build fontFaceDeclarations the same way the example app does
		const fontFaceDeclarations = buildFontFaceDeclarations(
			[{ name: "Rubik Variable", imports: ["@fontsource-variable/rubik/wght.css"] }],
			cssContents
		);

		// Write temp tokens file
		const tmpDir = path.join(__dirname, ".tmp");
		fs.mkdirSync(tmpDir, { recursive: true });
		fs.writeFileSync(
			path.join(tmpDir, "fonts.json"),
			JSON.stringify({
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
			})
		);

		const sd = new StyleDictionary({
			source: [path.join(tmpDir, "*.json")],
			platforms: {
				css: {
					transformGroup: "css",
					buildPath: path.join(tmpDir, "build/"),
					files: [
						{
							destination: "fonts.css",
							format: "gamesome/font-face-css",
							options: {
								fontFaceDeclarations,
								prettifyOutput: false,
							},
						},
					],
				},
			},
		});

		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		// Should NOT contain 'undefined'
		expect(outputCss).not.toContain("undefined");

		// Should contain the font-family declaration for html selector
		expect(outputCss).toContain("font-family:");
		expect(outputCss).toContain("Rubik Variable");

		// Should contain @font-face declarations from the fontsource CSS
		expect(outputCss).toContain("@font-face");
		expect(outputCss).toContain("rubik-arabic-wght-normal.woff2");
		expect(outputCss).toContain("rubik-latin-wght-normal.woff2");

		// Should contain fallback font declarations
		expect(outputCss).toContain("Rubik Variable Fallback");

		// Clean up
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should generate beautified CSS without 'undefined'", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[{ name: "Rubik Variable", imports: ["@fontsource-variable/rubik/wght.css"] }],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-beautify");
		fs.mkdirSync(tmpDir, { recursive: true });
		fs.writeFileSync(
			path.join(tmpDir, "fonts.json"),
			JSON.stringify({
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
			})
		);

		const sd = new StyleDictionary({
			source: [path.join(tmpDir, "*.json")],
			platforms: {
				css: {
					transformGroup: "css",
					buildPath: path.join(tmpDir, "build/"),
					files: [
						{
							destination: "fonts.css",
							format: "gamesome/font-face-css",
							options: {
								fontFaceDeclarations,
								prettifyOutput: true,
							},
						},
					],
				},
			},
		});

		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		// Must NOT contain 'undefined'
		expect(outputCss).not.toContain("undefined");

		// Beautified output should have newlines
		expect(outputCss).toContain("\n");

		// Should still contain proper CSS
		expect(outputCss).toContain("@font-face");
		expect(outputCss).toContain("Rubik Variable");

		// Clean up
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should handle SD's CSS transform group (quoted font names)", async () => {
		// SD's CSS transform group wraps font-family values in quotes
		// Our tokenHelpers should handle this via original.value
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[{ name: "Rubik Variable", imports: ["@fontsource-variable/rubik/wght.css"] }],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-quoted");
		fs.mkdirSync(tmpDir, { recursive: true });
		fs.writeFileSync(
			path.join(tmpDir, "fonts.json"),
			JSON.stringify({
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
			})
		);

		// Use CSS transform group which adds quotes around font names
		const sd = new StyleDictionary({
			source: [path.join(tmpDir, "*.json")],
			platforms: {
				css: {
					transformGroup: "css",
					buildPath: path.join(tmpDir, "build/"),
					files: [
						{
							destination: "fonts.css",
							format: "gamesome/font-face-css",
							options: {
								fontFaceDeclarations,
							},
						},
					],
				},
			},
		});

		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		// The CSS transform adds quotes around font names,
		// but our tokenHelpers should use original.value to get unquoted name
		expect(outputCss).not.toContain("undefined");
		expect(outputCss).toContain("Rubik Variable");
		expect(outputCss).not.toContain("'Rubik Variable' Fallback");

		// Clean up
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should return a comment when no font tokens exist", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const tmpDir = path.join(__dirname, ".tmp-empty");
		fs.mkdirSync(tmpDir, { recursive: true });
		fs.writeFileSync(
			path.join(tmpDir, "tokens.json"),
			JSON.stringify({
				color: {
					primary: {
						value: "#ff0000",
						type: "color",
					},
				},
			})
		);

		const sd = new StyleDictionary({
			source: [path.join(tmpDir, "*.json")],
			platforms: {
				css: {
					transformGroup: "css",
					buildPath: path.join(tmpDir, "build/"),
					files: [
						{
							destination: "fonts.css",
							format: "gamesome/font-face-css",
							options: {
								fontFaceDeclarations: {},
							},
						},
					],
				},
			},
		});

		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		expect(outputCss).toContain("No font tokens found");

		// Clean up
		fs.rmSync(tmpDir, { recursive: true });
	});
});
