"use client";

import Link from "next/link";
import { Activity, RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";

import { useJourney } from "./app-providers";

const links = [
  { href: "/journey", label: "Overview" },
  { href: "/mirror", label: "Guided Lab" },
  { href: "/explore", label: "Testnet Desk" },
  { href: "/guarded", label: "Settlement" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { summary, reset, busy } = useJourney();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e3e8ef] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101828] text-[11px] tracking-tight text-white">
            MR
          </span>
          <span className="hidden text-sm tracking-[-0.02em] lg:inline">
            Mainnet Ready
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-[#edf2ff] text-[#315efb]"
                    : "text-[#667085] hover:bg-[#f5f7fa] hover:text-[#101828]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-[#e3e8ef] px-3 py-2 text-xs font-bold md:flex">
            <Activity size={14} className="text-[#087a55]" />
            {summary?.unresolvedFindings ?? 0} open risks
          </div>
          <div className="hidden rounded-md bg-[#101828] px-3 py-2 text-xs font-bold text-white sm:block">
            {summary?.score ?? 0}/100
          </div>
          <button
            aria-label="Reset demo"
            onClick={() => void reset()}
            disabled={busy === "reset"}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e3e8ef] bg-white text-[#667085] hover:text-[#101828] disabled:opacity-40"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
