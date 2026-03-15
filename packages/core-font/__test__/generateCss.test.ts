import { describe, it, expect } from "vitest";
import { transform } from "lightningcss";
import { parsedFamilies } from "../src/normaliseOptions";
import { generateCss } from "../src/generateCss";
import type { FontFamily } from "../src/types";

import fs from "fs";
import path from "path";

const rubikVariable = fs
	.readdirSync(path.join(__dirname, "fixtures/rubik"))
	.map((file) => {
		const filePath = path.join(__dirname, "fixtures/rubik", file);
		const fileContent = fs.readFileSync(filePath, "utf-8");
		return {
			["rubik_" + file.replace(".css", "").replace("-", "_")]: fileContent,
		};
	})
	.reduce((acc, curr) => {
		const key = Object.keys(curr)[0];
		const value = curr[key];
		return {
			...acc,
			[key]: value,
		};
	}, {});

const dmSansVariable = fs
	.readdirSync(path.join(__dirname, "fixtures/dm-sans"))
	.map((file) => {
		const filePath = path.join(__dirname, "fixtures/dm-sans", file);
		const fileContent = fs.readFileSync(filePath, "utf-8");
		return {
			["dm_sans_" + file.replace(".css", "").replace("-", "_")]: fileContent,
		};
	})
	.reduce((acc, curr) => {
		const key = Object.keys(curr)[0];
		const value = curr[key];
		return {
			...acc,
			[key]: value,
		};
	}, {});

const expectLightningCssToProcess = (css: string) => {
	expect(() =>
		transform({
			filename: "test.css",
			code: Buffer.from(css),
			minify: false,
		})
	).not.toThrow();
};

const expectLightningCssToThrow = (css: string) => {
	expect(() =>
		transform({
			filename: "test.css",
			code: Buffer.from(css),
			minify: false,
		})
	).toThrow();
};

describe("generateCss", () => {
	it("should reject invalid css in lightningcss", () => {
		expectLightningCssToThrow(`a { color red; }`);
	});

	it("should reject stray commas between @font-face blocks in lightningcss", () => {
		expectLightningCssToThrow(
			`@font-face { font-family: "One"; src: url(one.woff2); }, @font-face { font-family: "Two"; src: url(two.woff2); }`
		);
	});

	it("should throw without families", async () => {
		await expect(
			generateCss({
				families: [],
				fontFaceDeclarations: {},
			})
		).rejects.toThrow("@gamesome/core-font: No families provided");
	});

	it("should handle the basic example from the docs", async () => {
		const families = parsedFamilies([
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: [
					"@fontsource-variable/rubik/wght.css",
					"@fontsource-variable/rubik/wght-italic.css",
				],
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				rubik_variable: rubikVariable,
			},
		});

		expectLightningCssToProcess(result.css);

		expect(result.css).toBe(
			`html{font-family:"Rubik Variable","Rubik Variable Fallback: Helvetica","Rubik Variable Fallback: Helvetica Neue","Rubik Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"!important}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-arabic-wght-italic.woff2) format('woff2-variations');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-wght-italic.woff2) format('woff2-variations');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-hebrew-wght-italic.woff2) format('woff2-variations');unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-wght-italic.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-arabic-wght-normal.woff2) format("woff2-variations");unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-wght-normal.woff2) format("woff2-variations");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-hebrew-wght-normal.woff2) format("woff2-variations");unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-wght-normal.woff2) format("woff2-variations");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"Rubik Variable Fallback: Helvetica";src:local('Helvetica');font-display:swap;ascent-override:89.0649%;descent-override:23.8141%;size-adjust:104.9796%}@font-face{font-family:"Rubik Variable Fallback: Helvetica Neue";src:local('Helvetica Neue'),local('HelveticaNeue');font-display:swap;ascent-override:89.9038%;descent-override:24.0385%;line-gap-override:0%;size-adjust:104%}@font-face{font-family:"Rubik Variable Fallback: Arial";src:local('Arial'),local('ArialMT');font-display:swap;ascent-override:89.0649%;descent-override:23.8141%;line-gap-override:0%;size-adjust:104.9796%}@font-face{font-family:"Rubik Variable Fallback: Helvetica";src:local('Helvetica Bold');font-display:swap;font-weight:700;ascent-override:89.5772%;descent-override:23.9511%;size-adjust:104.3792%}@font-face{font-family:"Rubik Variable Fallback: Helvetica Neue";src:local('Helvetica Neue Bold');font-display:swap;font-weight:700;ascent-override:89.5808%;descent-override:23.9521%;line-gap-override:0%;size-adjust:104.375%}@font-face{font-family:"Rubik Variable Fallback: Arial";src:local('Arial Bold');font-display:swap;font-weight:700;ascent-override:89.5772%;descent-override:23.9511%;line-gap-override:0%;size-adjust:104.3792%}`
		);
	});

	it("should not produce 'undefined' when prettifyOutput is true", async () => {
		const families = parsedFamilies([
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/rubik/wght.css"],
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				rubik_variable: rubikVariable,
			},
			prettifyOutput: true,
		});

		expectLightningCssToProcess(result.css);
		expect(result.css).not.toContain("undefined");
		expect(result.css).toContain("\n");
	});

	it("should handle another simple font (dm-sans)", async () => {
		const families = parsedFamilies([
			{
				name: "DM Sans Variable",
				type: "sans-serif",
				imports: [
					"@fontsource-variable/dm-sans/wght.css",
					"@fontsource-variable/dm-sans/wght-italic.css",
				],
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				dm_sans_variable: dmSansVariable,
			},
		});

		expectLightningCssToProcess(result.css);

		expect(result.css).toBe(
			`html{font-family:"DM Sans Variable","DM Sans Variable Fallback: Helvetica","DM Sans Variable Fallback: Helvetica Neue","DM Sans Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"!important}@font-face{font-family:'DM Sans Variable';font-style:italic;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'DM Sans Variable';font-style:italic;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-wght-italic.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:'DM Sans Variable';font-style:normal;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-ext-wght-normal.woff2) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'DM Sans Variable';font-style:normal;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-wght-normal.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"DM Sans Variable Fallback: Helvetica";src:local('Helvetica');font-display:swap;ascent-override:94.9001%;descent-override:29.6563%;size-adjust:104.531%}@font-face{font-family:"DM Sans Variable Fallback: Helvetica Neue";src:local('Helvetica Neue'),local('HelveticaNeue');font-display:swap;ascent-override:95.794%;descent-override:29.9356%;line-gap-override:0%;size-adjust:103.5556%}@font-face{font-family:"DM Sans Variable Fallback: Arial";src:local('Arial'),local('ArialMT');font-display:swap;ascent-override:94.9001%;descent-override:29.6563%;line-gap-override:0%;size-adjust:104.531%}@font-face{font-family:"DM Sans Variable Fallback: Helvetica";src:local('Helvetica Bold');font-display:swap;font-weight:700;ascent-override:96.5802%;descent-override:30.1813%;size-adjust:102.7125%}@font-face{font-family:"DM Sans Variable Fallback: Helvetica Neue";src:local('Helvetica Neue Bold');font-display:swap;font-weight:700;ascent-override:96.5842%;descent-override:30.1826%;line-gap-override:0%;size-adjust:102.7083%}@font-face{font-family:"DM Sans Variable Fallback: Arial";src:local('Arial Bold');font-display:swap;font-weight:700;ascent-override:96.5802%;descent-override:30.1813%;line-gap-override:0%;size-adjust:102.7125%}`
		);
	});

	it("should handle multiple fonts", async () => {
		const rubikFamily: FontFamily = {
			name: "Rubik Variable",
			type: "sans-serif",
			imports: ["@fontsource-variable/rubik/wght.css"],
			fallbacks: false,
			appendFontFamilies: false,
			applyFontFamilyToSelector: false,
		};
		const dmSansFamily: FontFamily = {
			name: "DM Sans Variable",
			type: "sans-serif",
			imports: ["@fontsource-variable/dm-sans/wght.css"],
			fallbacks: false,
			appendFontFamilies: false,
			applyFontFamilyToSelector: false,
		};

		const rubikResult = await generateCss({
			families: parsedFamilies([rubikFamily]),
			fontFaceDeclarations: {
				rubik_variable: {
					rubik_wght: rubikVariable.rubik_wght,
				},
			},
		});

		const dmSansResult = await generateCss({
			families: parsedFamilies([dmSansFamily]),
			fontFaceDeclarations: {
				dm_sans_variable: {
					dm_sans_wght: dmSansVariable.dm_sans_wght,
				},
			},
		});

		const combinedResult = await generateCss({
			families: parsedFamilies([rubikFamily, dmSansFamily]),
			fontFaceDeclarations: {
				rubik_variable: {
					rubik_wght: rubikVariable.rubik_wght,
				},
				dm_sans_variable: {
					dm_sans_wght: dmSansVariable.dm_sans_wght,
				},
			},
		});

		expectLightningCssToProcess(rubikResult.css);
		expectLightningCssToProcess(dmSansResult.css);
		expectLightningCssToProcess(combinedResult.css);
		expect(combinedResult.css).toBe(`${rubikResult.css}${dmSansResult.css}`);
	});

	it("should generate font faces without applying them when applyFontFamilyToSelector is false", async () => {
		const families = parsedFamilies([
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/rubik/wght.css"],
				fallbacks: false,
				appendFontFamilies: false,
				applyFontFamilyToSelector: false,
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				rubik_variable: {
					rubik_wght: rubikVariable.rubik_wght,
				},
			},
		});

		expectLightningCssToProcess(result.css);
		expect(result.css).toContain('font-family:"Rubik Variable"');
		expect(result.css).not.toContain("html{font-family:");
		expect(result.css).not.toContain(".font-serif{font-family:");
		expect(result.css).not.toContain(".font-sans{font-family:");
	});

	it("should use supported custom bold weights when Capsize exposes that variant", async () => {
		const families = parsedFamilies([
			{
				name: "DM Sans Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/dm-sans/wght.css"],
				fallbacks: [
					{
						name: "Helvetica",
						bold: {
							suffix: "Light",
							weight: 300,
						},
					},
				],
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				dm_sans_variable: dmSansVariable,
			},
		});

		expect(result.css).toContain("local('Helvetica Light')");
		expect(result.css).toContain("font-weight:300");
	});

	it("should throw for unsupported custom bold weights with a clear fix", async () => {
		const families = parsedFamilies([
			{
				name: "DM Sans Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/dm-sans/wght.css"],
				fallbacks: [
					{
						name: "Arial",
						bold: {
							suffix: "SemiBold",
							weight: 600,
						},
					},
				],
			},
		]);

		await expect(
			generateCss({
				families,
				fontFaceDeclarations: {
					dm_sans_variable: dmSansVariable,
				},
			})
		).rejects.toThrow(/bold\.weight 600/);
		await expect(
			generateCss({
				families,
				fontFaceDeclarations: {
					dm_sans_variable: dmSansVariable,
				},
			})
		).rejects.toThrow(/Use bold\.scaling/);
	});

	it("should let bold.scaling override calculated values", async () => {
		const families = parsedFamilies([
			{
				name: "DM Sans Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/dm-sans/wght.css"],
				fallbacks: [
					{
						name: "Helvetica",
						bold: {
							suffix: "Bold",
							weight: 700,
							scaling: {
								sizeAdjust: "111%",
							},
						},
					},
				],
			},
		]);

		const result = await generateCss({
			families,
			fontFaceDeclarations: {
				dm_sans_variable: dmSansVariable,
			},
		});

		expect(result.css).toContain("local('Helvetica Bold')");
		expect(result.css).toContain("font-weight:700");
		expect(result.css).toContain("size-adjust:111%");
	});
});
