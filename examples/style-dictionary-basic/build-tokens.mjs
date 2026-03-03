import StyleDictionary from "style-dictionary";
import {
	gamesomeFontFaceFormat,
	buildFontFaceDeclarations,
} from "@gamesome/style-dictionary-font";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);

// Register the custom format
StyleDictionary.registerFormat(gamesomeFontFaceFormat);

// Read the token file to discover all font imports
const tokensPath = path.join(import.meta.dirname, "src", "tokens", "fonts.json");
const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));

// Collect all CSS imports and font families from tokens
const cssContents = {};
const families = [];
const generatedFilesDir = path.join(import.meta.dirname, "src", "tokens", "generated", "files");
fs.mkdirSync(generatedFilesDir, { recursive: true });

for (const [, token] of Object.entries(tokens.font.family)) {
	const ext = token.$extensions?.["gamesome.font"];
	if (!ext) continue;

	const family = { name: token.value, imports: ext.imports };
	if (ext.fontType) family.type = ext.fontType;
	if (ext.applyFontFamilyToSelector) family.applyFontFamilyToSelector = ext.applyFontFamilyToSelector;
	families.push(family);

	for (const imp of ext.imports) {
		if (cssContents[imp]) continue;

		const cssPath = require.resolve(imp);
		cssContents[imp] = fs.readFileSync(cssPath, "utf-8");

		// Copy font files next to the generated CSS so relative ./files/ URLs resolve
		const fontsourceFilesDir = path.join(path.dirname(cssPath), "files");
		if (fs.existsSync(fontsourceFilesDir)) {
			for (const file of fs.readdirSync(fontsourceFilesDir)) {
				fs.copyFileSync(
					path.join(fontsourceFilesDir, file),
					path.join(generatedFilesDir, file)
				);
			}
		}
	}
}

// Build fontFaceDeclarations from families and CSS contents
const fontFaceDeclarations = buildFontFaceDeclarations(families, cssContents);

const sd = new StyleDictionary({
	source: ["src/tokens/**/*.json"],
	platforms: {
		css: {
			transformGroup: "css",
			buildPath: "src/tokens/generated/",
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
console.log("Token build complete!");
