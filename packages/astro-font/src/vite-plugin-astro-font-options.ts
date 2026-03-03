import type { FontOptions } from "@gamesome/core-font";
import { parsedFamilies } from "@gamesome/core-font";
import type { Plugin } from "vite";

export function vitePluginAstroFontOptions(options: FontOptions): Plugin {
	const virtualModuleId = `virtual:gamesome/astro-font-options`;
	const resolvedVirtualModuleId = "\0" + virtualModuleId;

	return {
		name: "vite-plugin-gamesome-astro-font-options",
		async resolveId(id: string) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) {
				const optionsWithDefaults = {
					...options,
					families: parsedFamilies(options.families),
				};

				return `export default ${JSON.stringify(optionsWithDefaults)}`;
			}
		},
	};
}
