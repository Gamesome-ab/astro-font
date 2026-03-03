declare module "virtual:*" {
	const component: any;
	export default component;
}

declare module "virtual:gamesome/astro-font-initial-css" {
	const fontFaceDeclrataions: {
		[familyName: string]: {
			[styleName: string]: string;
		};
	};
	export default fontFaceDeclrataions;
}
