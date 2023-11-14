import {
	getRelevantFontFaceBlok,
	updatePropInFontFace,
	updatePropsInFontFace,
} from "../css-utils";
import type { ParsedFallbackFont } from "types";

export const createBoldFallbackFontFace = (
	fallbacks: ParsedFallbackFont[],
	baseFontFace: string
) => {
	const fallbackFontFaceDeclarations = [];
	fallbacks.forEach((fallback) => {
		if (fallback.bold) {
			let relevantFontFaceBlock = getRelevantFontFaceBlok(
				baseFontFace,
				fallback.name
			);

			relevantFontFaceBlock = relevantFontFaceBlock.replace(
				`local('${fallback.name}')`,
				`local('${fallback.name} ${fallback.bold.suffix}')`
			);
			relevantFontFaceBlock = updatePropInFontFace(
				relevantFontFaceBlock,
				"font-weight",
				fallback.bold.weight
			);
			if (fallback.bold.scaling) {
				relevantFontFaceBlock = updatePropsInFontFace(
					relevantFontFaceBlock,
					fallback.bold.scaling as Record<string, string>
				);
			}
			fallbackFontFaceDeclarations.push(relevantFontFaceBlock);
		}
	});
	return fallbackFontFaceDeclarations;
};
