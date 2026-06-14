import clsx from "clsx";

interface ScoreRingProps {
  score: number;
  max: number;
  size?: number;
  className?: string;
}

export function ScoreRing({ score, max, size = 80, className }: ScoreRingProps) {
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const fill = Math.min(score / max, 1);
  const offset = circumference * (1 - fill);
  const c = size / 2;
  const complete = fill >= 1;

  return (
    <div
      className={clsx("relative flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="#e3e8ef"
        />
        {score > 0 && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={complete ? "#087a55" : "#315efb"}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-bold">{score}</span>
        <span className="mt-0.5 text-[10px] text-[#667085]">/ {max}</span>
      </div>
    </div>
  );
}
