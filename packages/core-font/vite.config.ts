import { defineConfig, Plugin } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

const name = "core-font";

export default defineConfig(() => {
	return {
		build: {
			emptyOutDir: true,
			lib: {
				entry: path.resolve(__dirname, "src/index.ts"),
				name: "coreFont",
				fileName: (format) => (format === "es" ? `${name}.mjs` : `${name}.js`),
			},
			rollupOptions: {
				external: [
					"clean-css",
					"@capsizecss/core",
					"@capsizecss/metrics",
					"@capsizecss/metrics/entireMetricsCollection",
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
