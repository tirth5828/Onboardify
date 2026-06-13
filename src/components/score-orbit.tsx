export function ScoreOrbit({
  score,
  label = "readiness",
  size = "large",
}: {
  score: number;
  label?: string;
  size?: "small" | "large";
}) {
  const radius = size === "large" ? 74 : 42;
  const stroke = size === "large" ? 11 : 8;
  const dimension = radius * 2 + stroke * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="rgba(16,24,22,.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="#315efb"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`${size === "large" ? "text-5xl" : "text-2xl"} display font-bold`}>
          {score}
        </div>
        <div className="eyebrow mt-1 text-[9px] text-[#63706b]">{label}</div>
      </div>
    </div>
  );
}
