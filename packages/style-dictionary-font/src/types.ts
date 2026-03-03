/**
 * A single entry in the preload manifest. Contains all attributes needed
 * to render a `<link rel="preload">` tag for a font file.
 */
export interface PreloadManifestEntry {
	/** Font file path (package path, e.g. @fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2) */
	href: string;
	rel: "preload";
	as: "font";
	/** MIME type of the font file */
	type: "font/woff2";
	crossorigin: "anonymous";
}
