import StyleDictionary from "style-dictionary";
import { gamesomeFontFaceFormat } from "@gamesome/style-dictionary-font";

StyleDictionary.registerFormat(gamesomeFontFaceFormat);

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
						prettifyOutput: true,
					},
				},
			],
		},
	},
});

await sd.buildAllPlatforms();
console.log("Token build complete!");
