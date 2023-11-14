export const getRelevantFontFaceBlok = (
	fontFaceDeclarations: string,
	fontName: string
): string => {
	// given a string with multiple, possible multiline font-face blocks, return the one that matches the font
	// The correct block is the one that contains the font name in the local() function.

	const blocks = fontFaceDeclarations.split(/@font-face\s*{/gm);
	const relevantBlock = blocks.find((block) => {
		return block.includes(`local('${fontName}')`);
	});
	if (relevantBlock) {
		return `@font-face {${relevantBlock}`;
	} else {
		throw new Error(
			`@gamesome/astro-font: could not find any relevant font-face blocks in ${fontFaceDeclarations}`
		);
	}
};

export const updatePropInFontFace = (
	fontFaceDeclaration: string,
	prop: string,
	value
) => {
	const propRegex = new RegExp(`${prop}:.*;`);
	const propExists = propRegex.test(fontFaceDeclaration);
	if (propExists) {
		return fontFaceDeclaration.replace(propRegex, `${prop}: ${value};`);
	} else {
		return fontFaceDeclaration.replace("}", `  ${prop}: ${value};\n}`);
	}
};

const toKebabCase = (str: string) => {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};

export const updatePropsInFontFace = (
	fontFaceDeclaration: string,
	props: Record<string, string>
) => {
	let newFontFaceDeclaration = fontFaceDeclaration;
	Object.entries(props).forEach(([prop, value]) => {
		if (typeof value === "undefined") {
			return;
		}
		newFontFaceDeclaration = updatePropInFontFace(
			newFontFaceDeclaration,
			toKebabCase(prop),
			value
		);
	});
	return newFontFaceDeclaration;
};

// Borrowed from here: https://github.com/seek-oss/capsize/blob/ac26103410a053428c366c296811976f0746a426/packages/core/src/createFontStack.ts#L64C9-L64C9
export const quoteIfNeeded = (name: string) => {
	const quotedMatch = name.match(/^['"](?<name>.*)['"]$/);
	if (quotedMatch && quotedMatch.groups?.name) {
		// Escape double quotes in middle of name
		return `"${quotedMatch.groups.name.split(`"`).join(`\"`)}"`;
	}

	if (/^"/.test(name)) {
		// Complete double quotes if incomplete and escape double quotes in middle
		const [, ...restName] = name;
		return `"${restName.map((x) => (x === `"` ? `\"` : x)).join("")}"`;
	}

	if (!/^[a-zA-Z\d\-_]+$/.test(name)) {
		// Wrap in quotes if contains any characters that are not letters,
		// numbers, hyphens or underscores
		return `"${name.split(`"`).join(`\"`)}"`;
	}

	return name;
};
