import clsx from "clsx";
import { ArrowRight, Clock, Fuel } from "lucide-react";

export interface RouteCardProps {
  fromChain: string;
  fromToken: string;
  fromAmount: number;
  toChain: string;
  toToken: string;
  estimatedOutput: number;
  tool: string;
  estimatedGasUsd: number;
  estimatedDurationSecs: number;
  source: "lifi" | "simulated";
  className?: string;
}

export function RouteCard({
  fromChain,
  fromToken,
  fromAmount,
  toChain,
  toToken,
  estimatedOutput,
  tool,
  estimatedGasUsd,
  estimatedDurationSecs,
  source,
  className,
}: RouteCardProps) {
  const minutes = Math.ceil(estimatedDurationSecs / 60);

  return (
    <div
      className={clsx(
        "rounded-lg border border-[#e3e8ef] bg-[#f8fafc] p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold">Via {tool}</span>
          {source === "lifi" ? (
            <span className="rounded bg-[#edf2ff] px-1.5 py-0.5 text-[9px] font-bold text-[#315efb]">
              LI.FI
            </span>
          ) : (
            <span className="rounded bg-[#f2f4f7] px-1.5 py-0.5 text-[9px] font-bold text-[#667085]">
              SIMULATED
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#667085]">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {minutes}m
          </span>
          <span className="flex items-center gap-1">
            <Fuel size={10} />${estimatedGasUsd.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-white p-3 text-center">
          <p className="text-[10px] text-[#667085]">{fromChain}</p>
          <p className="mt-1 font-mono text-sm font-bold">
            {fromAmount} {fromToken}
          </p>
        </div>
        <ArrowRight size={14} className="shrink-0 text-[#98a2b3]" />
        <div className="flex-1 rounded-lg bg-white p-3 text-center">
          <p className="text-[10px] text-[#667085]">{toChain}</p>
          <p className="mt-1 font-mono text-sm font-bold">
            ~{estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
            {toToken}
          </p>
        </div>
      </div>
    </div>
  );
}
