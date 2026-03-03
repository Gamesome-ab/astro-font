import { defineConfig, Plugin } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

const name = "style-dictionary-font";

export default defineConfig(() => {
	return {
		build: {
			emptyOutDir: true,
			lib: {
				entry: path.resolve(__dirname, "src/index.ts"),
				name: "styleDictionaryFont",
				fileName: (format) => (format === "es" ? `${name}.mjs` : `${name}.js`),
			},
			rollupOptions: {
				external: [
					"@gamesome/core-font",
					"style-dictionary",
				],
			},
		},
		plugins: [
			dts({
				outDir: "dist/types",
			}) as unknown as Plugin,
		],
	};
});
