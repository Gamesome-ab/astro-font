import { describe, it, expect, vi, assert } from "vitest";
import { parsedFamilies } from "../normaliseOptions";

import fs from "fs";
import path from "path";

const rubikVariable = fs
	.readdirSync(path.join(__dirname, "frontmatter-assets/rubik"))
	.map((file) => {
		const filePath = path.join(__dirname, "frontmatter-assets/rubik", file);
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
	.readdirSync(path.join(__dirname, "frontmatter-assets/dm-sans"))
	.map((file) => {
		const filePath = path.join(__dirname, "frontmatter-assets/dm-sans", file);
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

describe("getCssAndPreloads", () => {
	it("should throw without options", async () => {
		vi.resetModules();
		vi.doMock("virtual:gamesome/astro-font-initial-css", () => ({
			default: {},
		}));
		vi.doMock("virtual:gamesome/astro-font-options", () => ({
			default: {},
		}));
		const { getCssAndPreloads } = await import("../components/frontmatter");

		await expect(getCssAndPreloads).rejects.toThrow(
			"@gamesome/astro-font: No option"
		);
	});

	it("should throw without meaningful options", async () => {
		vi.resetModules();
		vi.doMock("virtual:gamesome/astro-font-initial-css", () => ({
			default: {},
		}));
		vi.doMock("virtual:gamesome/astro-font-options", () => ({
			default: {
				families: [
					{
						imports: [],
					},
				],
			},
		}));

		const { getCssAndPreloads } = await import("../components/frontmatter");

		await expect(getCssAndPreloads).rejects.toThrow(
			"@gamesome/astro-font: No options"
		);
	});

	it("should should handle the basic example from the docs", async () => {
		vi.resetModules();

		const families = [
			{
				name: "Rubik Variable",
				imports: [
					"@fontsource-variable/rubik/wght.css",
					"@fontsource-variable/rubik/wght-italic.css",
				],
			},
		];

		vi.doMock("virtual:gamesome/astro-font-options", () => ({
			default: {
				families: parsedFamilies(families),
			},
		}));

		vi.doMock("virtual:gamesome/astro-font-initial-css", () => ({
			default: {
				rubik_variable: rubikVariable,
			},
		}));

		const { getCssAndPreloads } = await import("../components/frontmatter");
		const result = await getCssAndPreloads();
		expect(result.css).toBe(
			`html{font-family:"Rubik Variable","Rubik Variable Fallback: Helvetica","Rubik Variable Fallback: Helvetica Neue","Rubik Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"!important}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-arabic-wght-italic.woff2) format('woff2-variations');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-wght-italic.woff2) format('woff2-variations');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-hebrew-wght-italic.woff2) format('woff2-variations');unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'Rubik Variable';font-style:italic;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-wght-italic.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-arabic-wght-normal.woff2) format("woff2-variations");unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-cyrillic-wght-normal.woff2) format("woff2-variations");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-hebrew-wght-normal.woff2) format("woff2-variations");unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:"Rubik Variable";font-style:normal;font-display:swap;font-weight:300 900;src:url(./files/rubik-latin-wght-normal.woff2) format("woff2-variations");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"Rubik Fallback: Helvetica";src:local('Helvetica');font-display:swap;ascent-override:88.5654%;descent-override:23.6806%;size-adjust:105.5717%}@font-face{font-family:"Rubik Fallback: Helvetica Neue";src:local('Helvetica Neue');font-display:swap;ascent-override:89.6878%;descent-override:23.9807%;size-adjust:104.2506%}@font-face{font-family:"Rubik Fallback: Arial";src:local('Arial');font-display:swap;ascent-override:88.5654%;descent-override:23.6806%;size-adjust:105.5717%}@font-face{font-family:"Rubik Fallback: Helvetica";src:local('Helvetica Bold');font-display:swap;ascent-override:88.5654%;descent-override:23.6806%;size-adjust:105.5717%;font-weight:700}@font-face{font-family:"Rubik Fallback: Helvetica Neue";src:local('Helvetica Neue Bold');font-display:swap;ascent-override:89.6878%;descent-override:23.9807%;size-adjust:104.2506%;font-weight:700}@font-face{font-family:"Rubik Fallback: Arial";src:local('Arial Bold');font-display:swap;ascent-override:88.5654%;descent-override:23.6806%;size-adjust:105.5717%;font-weight:700}`
		);
	});

	it("should handle another simple font (dm-sans)", async () => {
		vi.resetModules();
		const families = [
			{
				name: "DM Sans Variable",
				imports: [
					"@fontsource-variable/dm-sans/wght.css",
					"@fontsource-variable/dm-sans/wght-italic.css",
				],
			},
		];

		vi.doMock("virtual:gamesome/astro-font-options", () => ({
			default: {
				families: parsedFamilies(families),
			},
		}));
		vi.doMock("virtual:gamesome/astro-font-initial-css", () => ({
			default: {
				dm_sans_variable: dmSansVariable,
			},
		}));

		const { getCssAndPreloads } = await import("../components/frontmatter");

		const result = await getCssAndPreloads();
		expect(result.css).toBe(
			`html{font-family:"DM Sans Variable","DM Sans Variable Fallback: Helvetica","DM Sans Variable Fallback: Helvetica Neue","DM Sans Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"!important}@font-face{font-family:'DM Sans Variable';font-style:italic;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-ext-wght-italic.woff2) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'DM Sans Variable';font-style:italic;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-wght-italic.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:'DM Sans Variable';font-style:normal;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-ext-wght-normal.woff2) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:'DM Sans Variable';font-style:normal;font-display:swap;font-weight:100 1000;src:url(./files/dm-sans-latin-wght-normal.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:"DM Sans Fallback: Helvetica";src:local('Helvetica');font-display:swap;ascent-override:94.3696%;descent-override:29.4905%;size-adjust:105.1186%}@font-face{font-family:"DM Sans Fallback: Helvetica Neue";src:local('Helvetica Neue');font-display:swap;ascent-override:95.5655%;descent-override:29.8642%;size-adjust:103.8031%}@font-face{font-family:"DM Sans Fallback: Arial";src:local('Arial');font-display:swap;ascent-override:94.3696%;descent-override:29.4905%;size-adjust:105.1186%}@font-face{font-family:"DM Sans Fallback: Helvetica";src:local('Helvetica Bold');font-display:swap;ascent-override:94.3696%;descent-override:29.4905%;size-adjust:105.1186%;font-weight:700}@font-face{font-family:"DM Sans Fallback: Helvetica Neue";src:local('Helvetica Neue Bold');font-display:swap;ascent-override:95.5655%;descent-override:29.8642%;size-adjust:103.8031%;font-weight:700}@font-face{font-family:"DM Sans Fallback: Arial";src:local('Arial Bold');font-display:swap;ascent-override:94.3696%;descent-override:29.4905%;size-adjust:105.1186%;font-weight:700}`
		);
	});
});
