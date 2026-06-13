"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Fingerprint,
  LockKeyhole,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import { ScoreOrbit } from "@/components/score-orbit";
import { WorldVerifyButton } from "@/components/world-verify-button";
import { baseSepoliaExplorer } from "@/lib/networks";

export default function PassportPage() {
  const { state, summary, loading, busy, post } = useJourney();
  if (loading || !state || !summary) return <LoadingScreen />;

  if (!summary.passportEligible) {
    return (
      <PageShell>
        <div className="glass mx-auto max-w-2xl rounded-xl p-10 text-center">
          <LockKeyhole className="mx-auto" size={34} />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Credential issuance is locked.</h1>
          <p className="mt-4 leading-7 text-[#667085]">
            Reach 80 points and complete the guarded and private settlement
            stages before proving unique-human readiness.
          </p>
          <Link href="/journey" className="button-primary mt-7">
            <ArrowLeft size={16} /> Review qualification path
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-9">
        <p className="eyebrow text-[#667085]">Behavioral credential</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-[-0.045em]">
          Mainnet readiness credential
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
          A non-transferable record backed by monitored testnet behavior and
          unique-human verification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <section className="glass rounded-xl p-6">
          <div className="flex justify-center py-5">
            <ScoreOrbit score={summary.score} />
          </div>
          <div className="mt-5 rounded-lg bg-[#f8fafc] p-5">
            <p className="eyebrow mb-4 text-[#63706b]">Verified competencies</p>
            <div className="space-y-3">
              {summary.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-3 text-sm font-bold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#eaf8f2] text-[#087a55]">
                    <Check size={14} />
                  </span>
                  {skill}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <WorldVerifyButton />
          </div>
          <button
            onClick={() => void post("/api/passport/claim", {}, "passport")}
            disabled={!state.world.verified || state.passport.claimed || busy === "passport"}
            className="button-primary mt-3 w-full"
          >
            {state.passport.claimed ? (
              <>
                <Check size={16} /> Passport minted
              </>
            ) : (
              <>
                <Medal size={17} /> Mint soulbound passport
              </>
            )}
          </button>
        </section>

        <section className="relative overflow-hidden rounded-xl bg-[#101828] p-6 text-white shadow-[0_18px_50px_rgba(16,24,40,.18)] lg:p-9">
          <div className="grid-lines absolute inset-0 opacity-15" />
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#315efb]/20 blur-3xl" />
          <div className="relative flex min-h-[590px] flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-[#7ea0ff]">Mainnet Ready</p>
                <p className="mt-2 text-sm text-white/45">Non-transferable readiness credential</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-white/8 text-[#7ea0ff]">
                <ShieldCheck size={25} />
              </span>
            </div>

            <div className="py-12 text-center">
              <div
                className={`mx-auto flex h-44 w-44 items-center justify-center rounded-full border ${
                  state.passport.claimed
                    ? "pulse-ring border-[#7ea0ff]/60 bg-[#315efb] text-white"
                    : "border-white/15 bg-white/5 text-white/30"
                }`}
              >
                {state.passport.claimed ? <Sparkles size={54} /> : <Fingerprint size={54} />}
              </div>
              <h2 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">
                {state.passport.claimed ? "Mainnet Ready" : "Awaiting issuance"}
              </h2>
              <p className="mt-3 text-sm text-white/50">
                {state.walletAddress
                  ? `${state.walletAddress.slice(0, 10)}...${state.walletAddress.slice(-8)}`
                  : "Embedded wallet"}
              </p>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-5">
                <div>
                  <p className="eyebrow text-[9px] text-white/35">Score</p>
                  <p className="mt-2 text-xl font-bold">{summary.score}/100</p>
                </div>
                <div>
                  <p className="eyebrow text-[9px] text-white/35">Skills</p>
                  <p className="mt-2 text-xl font-bold">{summary.skills.length}</p>
                </div>
                <div>
                  <p className="eyebrow text-[9px] text-white/35">Token</p>
                  <p className="mt-2 text-xl font-bold">
                    {state.passport.tokenId ? `#${state.passport.tokenId}` : "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-[9px] text-white/35">Credential status</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                    <span
                      className={`status-dot ${
                        state.passport.claimed ? "text-[#7ea0ff]" : "text-white/25"
                      }`}
                    />
                    {state.passport.claimed ? "Issued on Base Sepolia" : "Not yet issued"}
                  </p>
                </div>
                {state.passport.txHash && (
                  <a
                    href={`${baseSepoliaExplorer}/tx/${state.passport.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary !border-white/10 !bg-white/8 !text-white"
                  >
                    Explorer <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
