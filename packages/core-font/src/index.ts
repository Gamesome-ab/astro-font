// Types
export type {
	PreloadConfig,
	FontImport,
	FontScaling,
	FallbackFont,
	FontFamily,
	FontOptions,
	ParsedFallbackFont,
	ParsedPreloadConfig,
	ParsedFontImport,
	ParsedFontFamily,
	FontFaceDeclarations,
	GenerateCssInput,
	GenerateCssOutput,
} from "./types";

// Config parsing
export {
	parsedFamilies,
	_parsedType,
	_parsedPreloads,
	_parsedFontImport,
	_parsedFallbackFont,
	_parsedFallbacks,
	_parsedAppendFontFamilies,
	_parsedSelector,
	_parsedFamily,
} from "./normaliseOptions";

// Core CSS generation
export { generateCss } from "./generateCss";

// Utilities
export {
	quoteIfNeeded,
	getRelevantFontFaceBlok,
	updatePropInFontFace,
	updatePropsInFontFace,
} from "./utils/cssUtils";

export {
	styleNameFromCssImport,
	fontFamilyFromFamilyName,
} from "./utils/importExportNames";

// Bold fallback
export { createBoldFallbackFontFace } from "./createBoldFallbackFontFace";
