function buildAreaPath(points, baselineY) {
  if (!points.length) {
    return '';
  }

  const commands = [`M ${points[0].x} ${baselineY}`, `L ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length; index += 1) {
    commands.push(`L ${points[index].x} ${points[index].y}`);
  }

  commands.push(`L ${points.at(-1).x} ${baselineY}`, 'Z');
  return commands.join(' ');
}

function buildLinePath(points) {
  if (!points.length) {
    return '';
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function AreaTrendChart({
  data = [],
  series = [],
  xKey = 'age',
  title,
  height = 320,
  yTicks = 5,
  valueFormatter = (value) => value,
  className = ''
}) {
  if (!data.length || !series.length) {
    return null;
  }

  const width = 760;
  const padding = { top: 22, right: 20, bottom: 38, left: 70 };
  const values = data.flatMap((item) => series.map((entry) => Number(item[entry.key] ?? 0)));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const domainPadding = (maxValue - minValue || 1) * 0.08;
  const domainMin = minValue - domainPadding;
  const domainMax = maxValue + domainPadding;
  const drawableWidth = width - padding.left - padding.right;
  const drawableHeight = height - padding.top - padding.bottom;

  const xPosition = (index) => {
    if (data.length === 1) {
      return padding.left + drawableWidth / 2;
    }

    return padding.left + (index / (data.length - 1)) * drawableWidth;
  };

  const yPosition = (value) => {
    const ratio = (Number(value ?? 0) - domainMin) / (domainMax - domainMin || 1);
    return padding.top + drawableHeight - ratio * drawableHeight;
  };

  const baselineY = yPosition(0);
  const tickValues = Array.from({ length: yTicks + 1 }, (_, index) => {
    const ratio = index / yTicks;
    return domainMax - (domainMax - domainMin) * ratio;
  });

  return (
    <div className={`rounded-[26px] border border-slate/10 bg-white p-5 shadow-[0_18px_45px_rgba(23,38,50,0.08)] ${className}`}>
      {title ? <p className="mb-4 text-center font-display text-3xl text-slate/70">{title}</p> : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        {tickValues.map((tickValue) => {
          const y = yPosition(tickValue);

          return (
            <g key={tickValue}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(23,38,50,0.08)" strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="rgba(23,38,50,0.55)">
                {valueFormatter(tickValue)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const x = xPosition(index);

          return (
            <text
              key={`${item[xKey]}-${index}`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(23,38,50,0.55)"
            >
              {item[xKey]}
            </text>
          );
        })}

        <line x1={padding.left} y1={baselineY} x2={width - padding.right} y2={baselineY} stroke="rgba(23,38,50,0.25)" strokeWidth="1.25" />

        {series.map((entry) => {
          const points = data.map((item, index) => ({
            x: xPosition(index),
            y: yPosition(item[entry.key])
          }));

          return (
            <g key={entry.key}>
              <path d={buildAreaPath(points, baselineY)} fill={entry.fill} opacity={entry.fillOpacity ?? 1} />
              <path d={buildLinePath(points)} fill="none" stroke={entry.stroke} strokeWidth="2.5" />
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-5">
        {series.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2 text-sm text-slate/72">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.stroke }} />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}