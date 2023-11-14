import type {
	FallbackFont,
	FontFamily,
	FontImport,
	PreloadConfig,
} from "index";

export interface ParsedFallbackFont {
	name: FallbackFont["name"];
	bold: Required<FallbackFont>["bold"];
	scaling: Required<FallbackFont>["scaling"] | true;
}

export interface ParsedPreloadConfig extends PreloadConfig {
	forLocalesMatching: Required<PreloadConfig>["forLocalesMatching"];
}

export interface ParsedFontImport extends FontImport {
	name: string;
	preload: ParsedPreloadConfig[];
}

export interface ParsedFontFamily
	extends Omit<Required<FontFamily>, "fallbacks"> {
	imports: ParsedFontImport[];
	fallbacks: ParsedFallbackFont[] | false;
}
