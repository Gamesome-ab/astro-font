export const styleNameFromCssImport = (f: string) => {
	if (!f.endsWith(".css")) {
		throw new Error(
			`@gamesome/astro-font encounterd a font import that does not end with .css. ${JSON.stringify(
				f
			)}`
		);
	}
	const [fontname, filename] = f.split("/").slice(-2);
	const name = fontname + "-" + filename.replace(".css", "");
	return name.replace(/-/g, "_");
};

export const fontFamilyFromFamilyName = (f: string) => {
	return f.toLowerCase().replace(/ /g, "-").replace(/-/g, "_");
};
