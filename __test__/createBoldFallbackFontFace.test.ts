import { describe, it, assert } from "vitest";
import { getRelevantFontFaceBlok, updatePropInFontFace } from "../css-utils";

const removeWhitespace = (str: string) => {
	return str.replace(/\s/g, "");
};

describe("getRelevantFontFaceBlok", () => {
	const fontFaceDeclarations = `
  @font-face {
    font-family: "Rubik Fallback: Tahoma";
    src: local('Tahoma');
    font-display: swap;
    ascent-override: 89.3492%;
    descent-override: 23.8902%;
    size-adjust: 104.6456%;
  }
  @font-face {
    font-family: "Rubik Fallback: Arial";
    src: local('Arial');
    font-display: swap;
    ascent-override: 88.5654%;
    descent-override: 23.6806%;
    size-adjust: 105.5717%;
  }
  `;

	it("should return the relevant font-face block for the given font name", () => {
		const fontName = "Arial";
		const expected = `@font-face {
      font-family: "Rubik Fallback: Arial";
      src: local('Arial');
      font-display: swap;
      ascent-override: 88.5654%;
      descent-override: 23.6806%;
      size-adjust: 105.5717%;
    }`;
		const result = getRelevantFontFaceBlok(fontFaceDeclarations, fontName);
		assert.equal(removeWhitespace(result), removeWhitespace(expected));
	});

	it("should throw an error if no relevant font-face block is found", () => {
		const fontName = "Comic Sans";
		assert.throws(() => {
			getRelevantFontFaceBlok(fontFaceDeclarations, fontName);
		}, `@gamesome/astro-font: could not find any relevant font-face blocks in ${fontFaceDeclarations}`);
	});
});

describe("_updatePropInFontFace", () => {
	const fontFaceDeclaration = `
  @font-face {
    font-family: "Rubik Fallback: Tahoma";
    src: local('Tahoma');
    font-display: swap;
    ascent-override: 89.3492%;
    descent-override: 23.8902%;
    size-adjust: 104.6456%;
  }
  `;

	it("should update an existing property in the font-face declaration", () => {
		const prop = "ascent-override";
		const value = "420%";
		const expected = `
    @font-face {
      font-family: "Rubik Fallback: Tahoma";
      src: local('Tahoma');
      font-display: swap;
      ascent-override: 420%;
      descent-override: 23.8902%;
      size-adjust: 104.6456%;
    }
    `;
		const result = updatePropInFontFace(fontFaceDeclaration, prop, value);
		assert.equal(removeWhitespace(result), removeWhitespace(expected));
	});

	it("should add a new property to the font-face declaration if it doesn't exist", () => {
		const prop = "some-prop";
		const value = "69%";
		const expected = `
    @font-face {
      font-family: "Rubik Fallback: Tahoma";
      src: local('Tahoma');
      font-display: swap;
      ascent-override: 89.3492%;
      descent-override: 23.8902%;
      size-adjust: 104.6456%;
      some-prop: 69%;
    }
    `;
		const result = updatePropInFontFace(fontFaceDeclaration, prop, value);
		assert.equal(removeWhitespace(result), removeWhitespace(expected));
	});
});
