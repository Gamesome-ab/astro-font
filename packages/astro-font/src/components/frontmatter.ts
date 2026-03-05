import initialFontFaceDeclarations from "virtual:gamesome/astro-font-initial-css";
import options from "virtual:gamesome/astro-font-options";
import { generateCss } from "@gamesome/core-font";

export const getCssAndPreloads = async (locale?: string) =>
	generateCss({
		families: options.families,
		fontFaceDeclarations: initialFontFaceDeclarations,
		locale,
		prettifyOutput: options.prettifyOutput,
	});
