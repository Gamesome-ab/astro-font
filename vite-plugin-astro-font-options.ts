import type { AstroFontOptions } from "./index";
import { parsedFamilies } from "./normaliseOptions";
import type { Plugin } from "vite";

export function vitePluginAstroFontOptions(options: AstroFontOptions): Plugin {
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
					families: parsedFamilies(options.families),
				};

				return `export default ${JSON.stringify(optionsWithDefaults)}`;
			}
		},
	};
}
