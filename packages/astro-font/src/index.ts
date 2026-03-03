import { vitePluginAstroFontOptions } from "./vite-plugin-astro-font-options";
import { vitePluginAstroFontInitialCss } from "./vite-plugin-astro-font-initial-css";

import type { AstroIntegration } from "astro";
import type { FontOptions } from "@gamesome/core-font";

export type {
	PreloadConfig,
	FontImport,
	FontScaling,
	FallbackFont,
	FontFamily,
	FontOptions,
} from "@gamesome/core-font";

/** @deprecated Use FontOptions instead */
export type AstroFontOptions = FontOptions;

export default function astroFont(options: FontOptions): AstroIntegration {
	return {
		name: "@gamesome/astro-font",
		hooks: {
			"astro:config:setup": ({ injectScript, updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							vitePluginAstroFontOptions(options),
							vitePluginAstroFontInitialCss(options),
						],
					},
				});
			},
		},
	};
}
