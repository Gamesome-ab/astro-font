interface Props {
	primaryFont: string;
	primaryLabel: string;
	fallbackFonts: string[];
	sampleText: string;
}

export function FontComparison({
	primaryFont,
	primaryLabel,
	fallbackFonts,
	sampleText,
}: Props) {
	return (
		<>
			<h2>Side-by-side comparison</h2>
			{fallbackFonts.map((fallback) => (
				<div className="font-comparison" key={fallback}>
					<div className="font-panel">
						<h3>{primaryLabel} (web font)</h3>
						<div className="sample" style={{ fontFamily: primaryFont }}>
							{sampleText}
						</div>
						<div className="details">font-family: {primaryFont}</div>
					</div>
					<div className="font-panel">
						<h3>Fallback: {fallback} (scaled)</h3>
						<div
							className="sample"
							style={{
								fontFamily: `"${primaryLabel} Fallback: ${fallback}"`,
							}}
						>
							{sampleText}
						</div>
						<div className="details">
							font-family: "{primaryLabel} Fallback: {fallback}"
						</div>
					</div>
				</div>
			))}
		</>
	);
}
