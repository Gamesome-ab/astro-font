import { useRef, useEffect, useState } from "react";

interface Props {
	primaryFont: string;
	primaryLabel: string;
	fallbackFonts: string[];
	sampleText: string;
}

interface Measurement {
	label: string;
	width: number;
	isPrimary: boolean;
}

export function WidthComparison({
	primaryFont,
	primaryLabel,
	fallbackFonts,
	sampleText,
}: Props) {
	const measureRef = useRef<HTMLDivElement>(null);
	const [measurements, setMeasurements] = useState<Measurement[]>([]);
	const [boldMeasurements, setBoldMeasurements] = useState<Measurement[]>([]);

	useEffect(() => {
		const measure = () => {
			if (!measureRef.current) return;

			const el = measureRef.current;

			function doMeasure(fontWeight: string): Measurement[] {
				el.style.fontWeight = fontWeight;
				const results: Measurement[] = [];

				el.style.fontFamily = primaryFont;
				results.push({
					label: primaryLabel,
					width: el.getBoundingClientRect().width,
					isPrimary: true,
				});

				for (const fallback of fallbackFonts) {
					el.style.fontFamily = `"${primaryLabel} Fallback: ${fallback}"`;
					results.push({
						label: `Fallback: ${fallback}`,
						width: el.getBoundingClientRect().width,
						isPrimary: false,
					});
				}
				return results;
			}

			setMeasurements(doMeasure("normal"));
			setBoldMeasurements(doMeasure("bold"));
		};

		document.fonts.ready.then(measure);
	}, [primaryFont, fallbackFonts, sampleText]);

	const maxWidth = Math.max(...measurements.map((m) => m.width), 1);
	const boldMaxWidth = Math.max(...boldMeasurements.map((m) => m.width), 1);

	return (
		<div className="width-comparison">
			<h3>Text width comparison</h3>
			<p style={{ fontSize: "0.8rem", color: "#888", margin: "0 0 1rem" }}>
				Bars show measured text width of "{sampleText.slice(0, 30)}
				{sampleText.length > 30 ? "…" : ""}" at 16px.
			</p>

			{/* Hidden measurement element */}
			<div
				ref={measureRef}
				style={{
					position: "absolute",
					visibility: "hidden",
					whiteSpace: "nowrap",
					fontSize: "16px",
				}}
			>
				{sampleText}
			</div>

			{measurements.map((m) => (
				<div className="width-bar" key={m.label}>
					<div className="bar-label">
						{m.label} — {m.width.toFixed(1)}px
					</div>
					<div
						className={`bar ${m.isPrimary ? "primary" : "fallback"}`}
						style={{ width: `${(m.width / maxWidth) * 100}%` }}
					/>
				</div>
			))}

			<h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888", margin: "1.5rem 0 0.75rem" }}>Bold</h4>

			{boldMeasurements.map((m) => (
				<div className="width-bar" key={`bold-${m.label}`}>
					<div className="bar-label">
						{m.label} — {m.width.toFixed(1)}px
					</div>
					<div
						className={`bar ${m.isPrimary ? "primary" : "fallback"}`}
						style={{ width: `${(m.width / boldMaxWidth) * 100}%` }}
					/>
				</div>
			))}
		</div>
	);
}
