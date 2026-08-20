// Renders a simple SVG chart (no external chart library, no build step).
// points: [{ date, load }] chronological order.
export function trainingLoadChartSvg(points, { width = 340, height = 140 } = {}) {
  if (points.length === 0) return '';

  const padL = 30, padR = 10, padT = 14, padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxLoad = Math.max(...points.map(p => p.load), 10);
  const n = points.length;
  const xFor = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (v) => padT + innerH - (v / maxLoad) * innerH;

  const linePoints = points.map((p, i) => `${xFor(i)},${yFor(p.load)}`).join(' ');
  const areaPoints = `${padL},${padT + innerH} ${linePoints} ${xFor(n - 1)},${padT + innerH}`;

  const gridLines = [0.33, 0.66, 1].map(f => {
    const y = padT + innerH - f * innerH;
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="rgba(244,241,232,0.08)" stroke-width="1" />`;
  }).join('');

  const dots = points.map((p, i) =>
    `<circle cx="${xFor(i)}" cy="${yFor(p.load)}" r="3" fill="var(--marker-yellow)" />`).join('');

  // Show first/last date labels only, to keep it readable at small sizes.
  const firstLabel = points[0].dateLabel;
  const lastLabel = points[n - 1].dateLabel;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet">
      ${gridLines}
      <polyline points="${areaPoints}" fill="rgba(232,178,61,0.12)" stroke="none" />
      <polyline points="${linePoints}" fill="none" stroke="var(--marker-yellow)" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      <text x="${padL}" y="${height - 4}" font-size="10" fill="var(--chalk-dim)" font-family="var(--font-mono)">${firstLabel}</text>
      <text x="${width - padR}" y="${height - 4}" font-size="10" fill="var(--chalk-dim)" font-family="var(--font-mono)" text-anchor="end">${lastLabel}</text>
      <text x="${padL - 6}" y="${padT + 4}" font-size="10" fill="var(--chalk-dim)" font-family="var(--font-mono)" text-anchor="end">${maxLoad}</text>
    </svg>
  `;
}

// Weekly volume bar chart: [{ weekLabel, totalMinutes }]
export function weeklyVolumeChartSvg(weeks, { width = 340, height = 120 } = {}) {
  if (weeks.length === 0) return '';
  const padL = 10, padR = 10, padT = 10, padB = 20;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxVal = Math.max(...weeks.map(w => w.totalMinutes), 10);
  const barW = innerW / weeks.length * 0.6;
  const gap = innerW / weeks.length;

  const bars = weeks.map((w, i) => {
    const barH = (w.totalMinutes / maxVal) * innerH;
    const x = padL + i * gap + (gap - barW) / 2;
    const y = padT + innerH - barH;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${Math.max(2, barH)}" rx="3" fill="var(--marker-teal)" />
      <text x="${x + barW / 2}" y="${height - 4}" font-size="9" fill="var(--chalk-dim)" font-family="var(--font-mono)" text-anchor="middle">${w.weekLabel}</text>
    `;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
}
