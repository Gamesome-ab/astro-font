import { useRef, useEffect, useState } from "react";

interface Props {
	primaryFont: string;
	primaryLabel: string;
	fallbackFonts: string[];
}

interface FontMetrics {
	label: string;
	ascent: number;
	descent: number;
	lineHeight: number;
	capHeight: number;
}

export function MetricsTable({
	primaryFont,
	primaryLabel,
	fallbackFonts,
}: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [metrics, setMetrics] = useState<FontMetrics[]>([]);

	useEffect(() => {
		const doMeasure = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const measure = (fontFamily: string, label: string): FontMetrics => {
				ctx.font = `48px ${fontFamily}`;
				const tm = ctx.measureText("Hpg");
				return {
					label,
					ascent: tm.actualBoundingBoxAscent,
					descent: tm.actualBoundingBoxDescent,
					lineHeight: tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent,
					capHeight: ctx.measureText("H").actualBoundingBoxAscent,
				};
			};

			const results: FontMetrics[] = [measure(primaryFont, primaryLabel)];

			for (const fallback of fallbackFonts) {
				results.push(
					measure(
						`"${primaryLabel} Fallback: ${fallback}"`,
						`Fallback: ${fallback}`
					)
				);
			}

			setMetrics(results);
		};

		document.fonts.ready.then(doMeasure);
	}, [primaryFont, fallbackFonts]);

	const primary = metrics[0];

	return (
		<div className="metrics-table">
			<h3>Measured font metrics (48px)</h3>
			<canvas
				ref={canvasRef}
				width={1}
				height={1}
				style={{ display: "none" }}
			/>
			<table>
				<thead>
					<tr>
						<th>Font</th>
						<th>Ascent</th>
						<th>Descent</th>
						<th>Line Height</th>
						<th>Cap Height</th>
					</tr>
				</thead>
				<tbody>
					{metrics.map((m) => (
						<tr key={m.label}>
							<td className="metric-name">{m.label}</td>
							<td>
								{m.ascent.toFixed(1)}px
								{primary && m !== primary && (
									<DiffBadge
										value={m.ascent}
										reference={primary.ascent}
									/>
								)}
							</td>
							<td>
								{m.descent.toFixed(1)}px
								{primary && m !== primary && (
									<DiffBadge
										value={m.descent}
										reference={primary.descent}
									/>
								)}
							</td>
							<td>
								{m.lineHeight.toFixed(1)}px
								{primary && m !== primary && (
									<DiffBadge
										value={m.lineHeight}
										reference={primary.lineHeight}
									/>
								)}
							</td>
							<td>
								{m.capHeight.toFixed(1)}px
								{primary && m !== primary && (
									<DiffBadge
										value={m.capHeight}
										reference={primary.capHeight}
									/>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function DiffBadge({
	value,
	reference,
}: {
	value: number;
	reference: number;
}) {
	const diff = ((value - reference) / reference) * 100;
	const absDiff = Math.abs(diff);
	const color = absDiff < 2 ? "#27ae60" : absDiff < 5 ? "#f39c12" : "#e74c3c";

	return (
		<span
			style={{
				marginLeft: "0.4em",
				fontSize: "0.7rem",
				color,
				fontFamily: "monospace",
			}}
		>
			{diff >= 0 ? "+" : ""}
			{diff.toFixed(1)}%
		</span>
	);
}
