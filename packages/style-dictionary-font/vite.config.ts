import { defineConfig, type LibraryFormats, Plugin } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
	return {
		build: {
			emptyOutDir: true,
			lib: {
				entry: {
					"style-dictionary-font": path.resolve(__dirname, "src/index.ts"),
					"font-preload-plugin": path.resolve(__dirname, "src/fontPreloadPlugin.ts"),
				},
				formats: ["es", "cjs"] as LibraryFormats[],
			},
			rollupOptions: {
				external: [
					"@gamesome/core-font",
					"style-dictionary",
					"fs",
					"path",
					"module",
					"vite",
				],
				output: {
					entryFileNames: "[name].[format].js",
				},
			},
		},
		plugins: [
			dts({
				outDir: "dist/types",
			}) as unknown as Plugin,
		],
	};
});
