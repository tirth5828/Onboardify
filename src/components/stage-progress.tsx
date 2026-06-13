import { Check, LockKeyhole } from "lucide-react";

const stages = [
  { number: "01", label: "Mirror Mode", points: 70 },
  { number: "02", label: "Guarded Mainnet", points: 20 },
  { number: "03", label: "Private Settlement", points: 10 },
  { number: "04", label: "Passport", points: 0 },
];

export function StageProgress({
  score,
  worldVerified,
}: {
  score: number;
  worldVerified?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {stages.map((stage, index) => {
        const threshold = stages
          .slice(0, index + 1)
          .reduce((total, item) => total + item.points, 0);
        const complete =
          stage.label === "Passport" ? worldVerified : score >= threshold;
        const unlocked =
          index === 0 ||
          score >=
            stages
              .slice(0, index)
              .reduce((total, item) => total + item.points, 0);
        return (
          <div
            key={stage.label}
            className={`rounded-2xl border p-4 ${
              complete
                ? "border-[#087a55] bg-[#087a55] text-white"
                : unlocked
                  ? "border-black/10 bg-white/70"
                  : "border-black/6 bg-black/[.025] text-[#7c8581]"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="eyebrow">{stage.number}</span>
              {complete ? (
                <Check size={16} />
              ) : !unlocked ? (
                <LockKeyhole size={14} />
              ) : (
                <span className="status-dot text-[#315efb]" />
              )}
            </div>
            <p className="text-sm font-bold">{stage.label}</p>
          </div>
        );
      })}
    </div>
  );
}
