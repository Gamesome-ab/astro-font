import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fontPreloadPlugin } from "@gamesome/style-dictionary-font/font-preload-vite-plugin";

export default defineConfig({
	plugins: [
		react(),
		fontPreloadPlugin("src/tokens/generated/preloads.json"),
	],
});
