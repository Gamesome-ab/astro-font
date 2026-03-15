import { describe, it, expect } from "vitest";
import StyleDictionary from "style-dictionary";
import fs from "fs";
import path from "path";
import {
	gamesomeFontFaceFormat,
	buildFontFaceDeclarations,
} from "../src/format";
import type { PreloadManifestEntry } from "../src/types";

// Read the rubik fixture CSS from core-font's test fixtures
const fixturesDir = path.join(
	__dirname,
	"../../core-font/__test__/fixtures/rubik"
);
const rubikWghtCss = fs.readFileSync(
	path.join(fixturesDir, "wght.css"),
	"utf-8"
);

const cssContents: Record<string, string> = {
	"@fontsource-variable/rubik/wght.css": rubikWghtCss,
};

const rubikTokens = {
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

function writeTmpTokens(tmpDir: string, tokens: object = rubikTokens) {
	fs.mkdirSync(tmpDir, { recursive: true });
	fs.writeFileSync(path.join(tmpDir, "fonts.json"), JSON.stringify(tokens));
}

function buildSD(tmpDir: string, formatOptions: object = {}) {
	return new StyleDictionary({
		source: [path.join(tmpDir, "*.json")],
		platforms: {
			css: {
				transformGroup: "css",
				buildPath: path.join(tmpDir, "build/"),
				files: [
					{
						destination: "fonts.css",
						format: "gamesome/font-face-css",
						options: formatOptions,
					},
				],
			},
		},
	});
}

describe("style-dictionary integration", () => {
	it("should generate valid CSS with package path URLs", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[
				{
					name: "Rubik Variable",
					imports: ["@fontsource-variable/rubik/wght.css"],
				},
			],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp");
		writeTmpTokens(tmpDir);

		const sd = buildSD(tmpDir, { fontFaceDeclarations, prettifyOutput: false });
		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		expect(outputCss).not.toContain("undefined");
		expect(outputCss).toContain("font-family:");
		expect(outputCss).toContain("Rubik Variable");
		expect(outputCss).toContain("@font-face");
		expect(outputCss).toContain("rubik-arabic-wght-normal.woff2");
		expect(outputCss).toContain("rubik-latin-wght-normal.woff2");
		expect(outputCss).toContain("Rubik Variable Fallback");

		// URLs use fontsource package paths, not relative ./files/
		expect(outputCss).toContain("url(@fontsource-variable/rubik/files/");
		expect(outputCss).not.toContain("url(./files/");

		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should generate beautified CSS without 'undefined'", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[
				{
					name: "Rubik Variable",
					imports: ["@fontsource-variable/rubik/wght.css"],
				},
			],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-beautify");
		writeTmpTokens(tmpDir);

		const sd = buildSD(tmpDir, { fontFaceDeclarations, prettifyOutput: true });
		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		expect(outputCss).not.toContain("undefined");
		expect(outputCss).toContain("\n");
		expect(outputCss).toContain("@font-face");
		expect(outputCss).toContain("Rubik Variable");

		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should handle SD's CSS transform group (quoted font names)", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[
				{
					name: "Rubik Variable",
					imports: ["@fontsource-variable/rubik/wght.css"],
				},
			],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-quoted");
		writeTmpTokens(tmpDir);

		const sd = buildSD(tmpDir, { fontFaceDeclarations });
		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		expect(outputCss).not.toContain("undefined");
		expect(outputCss).toContain("Rubik Variable");
		expect(outputCss).not.toContain("'Rubik Variable' Fallback");

		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should generate css variables for object-based applyFontFamilyToSelector configs", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[
				{
					name: "Rubik Variable",
					imports: ["@fontsource-variable/rubik/wght.css"],
				},
			],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-css-variable");
		writeTmpTokens(tmpDir, {
			font: {
				family: {
					primary: {
						value: "Rubik Variable",
						type: "fontFamily",
						$extensions: {
							"gamesome.font": {
								fontType: "sans-serif",
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
		});

		const sd = buildSD(tmpDir, { fontFaceDeclarations });
		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);

		expect(outputCss).toContain(
			':root{--font-sans:"Rubik Variable","Rubik Variable Fallback: Helvetica","Rubik Variable Fallback: Helvetica Neue","Rubik Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"}'
		);
		expect(outputCss).toContain(
			".font-sans{font-family:var(--font-sans)!important}"
		);

		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should write preload manifest with link tag attributes", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const fontFaceDeclarations = buildFontFaceDeclarations(
			[
				{
					name: "Rubik Variable",
					imports: ["@fontsource-variable/rubik/wght.css"],
				},
			],
			cssContents
		);

		const tmpDir = path.join(__dirname, ".tmp-preloads");
		writeTmpTokens(tmpDir);

		const sd = buildSD(tmpDir, { fontFaceDeclarations });
		await sd.buildAllPlatforms();

		// Manifest written next to CSS output
		const preloadsPath = path.join(tmpDir, "build/preloads.json");
		expect(fs.existsSync(preloadsPath)).toBe(true);

		const manifest: PreloadManifestEntry[] = JSON.parse(
			fs.readFileSync(preloadsPath, "utf-8")
		);
		expect(manifest.length).toBeGreaterThan(0);

		// Each entry should have all link tag attributes
		const entry = manifest[0];
		expect(entry.rel).toBe("preload");
		expect(entry.as).toBe("font");
		expect(entry.type).toBe("font/woff2");
		expect(entry.crossorigin).toBe("anonymous");
		// href uses fontsource package path
		expect(entry.href).toContain("@fontsource-variable/rubik/files/");
		expect(entry.href).toContain("rubik-latin-wght-normal.woff2");

		fs.rmSync(tmpDir, { recursive: true });
	});

	it("should return a comment when no font tokens exist", async () => {
		StyleDictionary.registerFormat(gamesomeFontFaceFormat);

		const tmpDir = path.join(__dirname, ".tmp-empty");
		writeTmpTokens(tmpDir, {
			color: { primary: { value: "#ff0000", type: "color" } },
		});

		const sd = buildSD(tmpDir, {});
		await sd.buildAllPlatforms();

		const outputCss = fs.readFileSync(
			path.join(tmpDir, "build/fonts.css"),
			"utf-8"
		);
		expect(outputCss).toContain("No font tokens found");

		fs.rmSync(tmpDir, { recursive: true });
	});
});
