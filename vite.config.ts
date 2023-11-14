import { defineConfig, Plugin } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

const name = "astro-font";

export default defineConfig(() => {
	return {
		build: {
			lib: {
				entry: path.resolve(__dirname, "index.ts"),
				name: "astroFont",
				fileName: (format) => (format === "es" ? `${name}.mjs` : `${name}.js`),
			},
		},
		plugins: [
			dts({
				outDir: "dist/types",
			}) as unknown as Plugin,
		],
	};
});
