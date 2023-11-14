import type { Plugin } from "vite";
import type { AstroFontOptions } from "./index";
import { parsedFamilies } from "./normaliseOptions";
import { fontFamilyFromFamilyName } from "./importExportNames";

/**
 * creates the initial css with font-face for the fonts, using fontsource.
 * this will be used by fontainbleau to create the final css in the component.
 */
export function vitePluginAstroFontInitialCss(
	options: AstroFontOptions
): Plugin {
	const virtualModuleId = "virtual:gamesome/astro-font-initial-css";
	const resolvedVirtualModuleId = "\0" + virtualModuleId;

	return {
		name: "vite-plugin-gamesome-astro-font-initial-css",
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
				const importStatements: string[] = [];
				const exportMap: { exportKey: string; importKeys: string[] }[] = [];

				for (const f of optionsWithDefaults.families) {
					const expKey = fontFamilyFromFamilyName(f.name);
					const importKeys = [];
					for (const style of f.imports) {
						importKeys.push(style.name);
						importStatements.push(
							`import ${style.name} from "${style.css}?inline"`
						);
					}
					exportMap.push({ exportKey: expKey, importKeys });
				}
				return `${importStatements.join(";")};export default {${exportMap.map(
					(e) =>
						`${e.exportKey}: {${e.importKeys
							.map((k) => `${k}: ${k}`)
							.join(",")}}`
				)}};`;
			}
		},
	};
}
