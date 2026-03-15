import { describe, it, expect, vi } from "vitest";
import { parsedFamilies } from "@gamesome/core-font";
import type { FontFamily } from "@gamesome/core-font";

import fs from "fs";
import path from "path";

const rubikFixturesDir = path.join(
	__dirname,
	"../../core-font/__test__/fixtures/rubik"
);

const rubikVariable = fs
	.readdirSync(rubikFixturesDir)
	.map((file) => {
		const filePath = path.join(rubikFixturesDir, file);
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

const expectedRubikFontStack =
	'"Rubik Variable","Rubik Variable Fallback: Helvetica","Rubik Variable Fallback: Helvetica Neue","Rubik Variable Fallback: Arial",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

const expectedRubikImportantFontStack = `${expectedRubikFontStack}!important`;

const loadGetCssAndPreloads = async (families: FontFamily[]) => {
	vi.resetModules();

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

	return import("../src/components/frontmatter");
};

describe("astro-font integration", () => {
	it("should export getCssAndPreloads that delegates to core generateCss", async () => {
		const families: FontFamily[] = [
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: [
					"@fontsource-variable/rubik/wght.css",
					"@fontsource-variable/rubik/wght-italic.css",
				],
			},
		];

		const { getCssAndPreloads } = await loadGetCssAndPreloads(families);
		const result = await getCssAndPreloads();

		expect(result.css).toContain(
			`html{font-family:${expectedRubikImportantFontStack}}`
		);
		expect(result.css).toContain("Rubik Variable");
		expect(result.css).toContain("@font-face");
		expect(result.preloads.length).toBeGreaterThan(0);
	});

	it("should expose a css variable and reuse it in the selector rule", async () => {
		const families: FontFamily[] = [
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/rubik/wght.css"],
				applyFontFamilyToSelector: {
					selector: ".font-sans",
					cssVariable: "--font-sans",
				},
			},
		];

		const { getCssAndPreloads } = await loadGetCssAndPreloads(families);
		const result = await getCssAndPreloads();

		expect(result.css).toContain(
			`:root{--font-sans:${expectedRubikFontStack}}`
		);
		expect(result.css).toContain(
			".font-sans{font-family:var(--font-sans)!important}"
		);
		expect(result.css).toContain("@font-face");
		expect(result.preloads.length).toBeGreaterThan(0);
	});

	it("should allow css variable only output without a selector rule", async () => {
		const families: FontFamily[] = [
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/rubik/wght.css"],
				applyFontFamilyToSelector: {
					cssVariable: "--font-sans",
				},
			},
		];

		const { getCssAndPreloads } = await loadGetCssAndPreloads(families);
		const result = await getCssAndPreloads();

		expect(result.css).toContain(
			`:root{--font-sans:${expectedRubikFontStack}}`
		);
		expect(result.css).not.toContain("html{font-family:");
		expect(result.css).not.toContain("font-family:var(--font-sans)");
	});

	it("should let the first family override the default html selector", async () => {
		const families: FontFamily[] = [
			{
				name: "Rubik Variable",
				type: "sans-serif",
				imports: ["@fontsource-variable/rubik/wght.css"],
				applyFontFamilyToSelector: {
					selector: ".font-body",
					cssVariable: "--font-body",
				},
			},
		];

		const { getCssAndPreloads } = await loadGetCssAndPreloads(families);
		const result = await getCssAndPreloads();

		expect(result.css).toContain(
			`:root{--font-body:${expectedRubikFontStack}}`
		);
		expect(result.css).toContain(".font-body{font-family:var(--font-body)}");
		expect(result.css).not.toContain("html{font-family:");
	});
});
