import { defineConfig } from "astro/config";
import astroFont from "@gamesome/astro-font";

export default defineConfig({
	integrations: [
		astroFont({
			families: [
				{
					name: "Rubik Variable",
					imports: [
						"@fontsource-variable/rubik/wght.css",
						{
							css: "@fontsource-variable/rubik/wght-italic.css",
							preload: false,
						},
					],
				},
				{
					name: "Sora Variable",
					imports: ["@fontsource-variable/sora/wght.css"],
					applyFontFamilyToSelector: ".font-sora",
				},
				{
					name: "Lora Variable",
					type: "serif",
					imports: ["@fontsource-variable/lora/wght.css"],
					applyFontFamilyToSelector: ".font-lora",
				},
			],
		}),
	],
});
