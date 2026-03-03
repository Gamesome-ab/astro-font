import { useState } from "react";
import { FontComparison } from "./components/FontComparison";
import { OverlapTest } from "./components/OverlapTest";
import { MetricsTable } from "./components/MetricsTable";
import { WidthComparison } from "./components/WidthComparison";
import "../../utils/font-showcase.css";

const SAMPLE_TEXT = "Hamburgevons";

interface FontConfig {
	name: string;
	primaryFont: string;
	fallbackFonts: string[];
	className?: string;
}

const FONTS: FontConfig[] = [
	{
		name: "Rubik Variable",
		primaryFont: '"Rubik Variable"',
		fallbackFonts: ["Helvetica", "Helvetica Neue", "Arial"],
	},
	{
		name: "Sora Variable",
		primaryFont: '"Sora Variable"',
		fallbackFonts: ["Helvetica", "Helvetica Neue", "Arial"],
		className: "font-sora",
	},
	{
		name: "Lora Variable",
		primaryFont: '"Lora Variable"',
		fallbackFonts: ["Georgia", "Times New Roman"],
		className: "font-lora",
	},
];

export function App() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const font = FONTS[currentIndex];

	return (
		<>
			<nav className="font-nav">
				{FONTS.map((f, i) => (
					<button
						key={f.name}
						className={i === currentIndex ? "active" : ""}
						onClick={() => setCurrentIndex(i)}
					>
						{f.name}
					</button>
				))}
			</nav>
			<div className={`font-showcase ${font.className || ""}`}>
				<h1>{font.name}</h1>
				<p className="subtitle">
					Comparing <strong>{font.name}</strong> with its scaled
					fallback fonts generated via{" "}
					<code>@gamesome/style-dictionary-font</code>
				</p>

				<section className="generated-stack">
					<h2>Generated font stack</h2>
					<p className="sample">{SAMPLE_TEXT}</p>
					<p className="sample">
						The quick brown fox jumps over the lazy dog. 0123456789
					</p>
					<p className="details">
						No inline font-family — uses the generated{" "}
						{font.className ? `.${font.className}` : "html"} rule
						with full fallback chain
					</p>
				</section>

				<FontComparison
					primaryFont={font.primaryFont}
					primaryLabel={font.name}
					fallbackFonts={font.fallbackFonts}
					sampleText={SAMPLE_TEXT}
				/>

				<OverlapTest
					primaryFont={font.primaryFont}
					primaryLabel={font.name}
					fallbackFonts={font.fallbackFonts}
					sampleText={SAMPLE_TEXT}
				/>

				<WidthComparison
					primaryFont={font.primaryFont}
					primaryLabel={font.name}
					fallbackFonts={font.fallbackFonts}
					sampleText="The quick brown fox jumps over the lazy dog"
				/>

				<MetricsTable
					primaryFont={font.primaryFont}
					primaryLabel={font.name}
					fallbackFonts={font.fallbackFonts}
				/>
			</div>
		</>
	);
}
