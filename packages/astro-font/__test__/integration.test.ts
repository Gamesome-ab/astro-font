import { describe, it, expect, vi } from "vitest";
import { parsedFamilies } from "@gamesome/core-font";

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

describe("astro-font integration", () => {
	it("should export getCssAndPreloads that delegates to core generateCss", async () => {
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

		const { getCssAndPreloads } = await import(
			"../src/components/frontmatter"
		);
		const result = await getCssAndPreloads();
		expect(result.css).toContain("Rubik Variable");
		expect(result.css).toContain("@font-face");
	});
});
