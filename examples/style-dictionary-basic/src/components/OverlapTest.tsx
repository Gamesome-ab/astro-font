interface Props {
	primaryFont: string;
	primaryLabel: string;
	fallbackFonts: string[];
	sampleText: string;
}

export function OverlapTest({
	primaryFont,
	primaryLabel,
	fallbackFonts,
	sampleText,
}: Props) {
	return (
		<div className="ruler-container">
			<h3>Overlap test — do the fonts align?</h3>
			<p style={{ fontSize: "0.8rem", color: "#888", margin: "0 0 1rem" }}>
				Primary font in <span style={{ color: "#3498db" }}>blue</span>,
				fallback in <span style={{ color: "#e74c3c" }}>red</span>.
				Perfect alignment = minimal CLS on swap.
			</p>
			{fallbackFonts.map((fallback) => (
				<div
					key={fallback}
					style={{
						position: "relative",
						height: "4.5rem",
						marginBottom: "1.5rem",
						borderBottom: "1px solid #eee",
					}}
				>
					<div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							fontFamily: primaryFont,
							fontSize: "3rem",
							lineHeight: 1,
							color: "rgba(52, 152, 219, 0.5)",
							whiteSpace: "nowrap",
						}}
					>
						{sampleText}
					</div>
					<div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							fontFamily: `"${primaryLabel} Fallback: ${fallback}"`,
							fontSize: "3rem",
							lineHeight: 1,
							color: "rgba(231, 76, 60, 0.5)",
							whiteSpace: "nowrap",
						}}
					>
						{sampleText}
					</div>
					<div
						style={{
							position: "absolute",
							right: 0,
							bottom: "0.25rem",
							fontSize: "0.65rem",
							fontFamily: "monospace",
							color: "#999",
						}}
					>
						{primaryLabel} vs {fallback}
					</div>
				</div>
			))}
		</div>
	);
}
