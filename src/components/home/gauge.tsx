type GaugeProps = {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
};

export function Gauge({ value, color = "#ef4d23", showLabels = false, min = "389K", max = "425K" }: GaugeProps) {
  const activeTicks = Math.round((value / 100) * 40);
  const ticks = Array.from({ length: 40 }, (_, index) => {
    const angle = Math.PI + (index / 39) * Math.PI;
    const innerRadius = 70;
    const outerRadius = 80;
    return {
      x1: 100 + Math.cos(angle) * innerRadius,
      y1: 100 + Math.sin(angle) * innerRadius,
      x2: 100 + Math.cos(angle) * outerRadius,
      y2: 100 + Math.sin(angle) * outerRadius
    };
  });

  return (
    <div className="mx-auto w-full max-w-[260px]">
      <svg viewBox="0 0 200 120" className="w-full" role="img" aria-label={`${value}% achieved`}>
        {ticks.map((tick, index) => (
          <line key={index} {...tick} stroke={index < activeTicks ? color : "#d4d4d8"} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <text x="100" y="105" textAnchor="middle" fontSize="22" fontWeight="600" fill="#171717">{value}%</text>
      </svg>
      {showLabels ? <div className="flex justify-between px-2 text-[11px] text-neutral-500"><span>{min}</span><span>{max}</span></div> : null}
    </div>
  );
}
