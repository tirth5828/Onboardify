"use client";

import { useContext } from "react";
import { Cpu, Wallet } from "lucide-react";
import { WalletContext } from "@/components/app-providers";
import { dynamicClient } from "@/lib/dynamic-client";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Checks for a Ledger hardware wallet using the SDK's `hardwareWalletVendor`
 * field on the wallet account object. The Dynamic SDK sets this to `'ledger'`
 * when the user connected via Ledger hardware.
 */
function isLedgerWallet(wallet: unknown): boolean {
  if (!wallet || typeof wallet !== "object") return false;
  const w = wallet as Record<string, unknown>;
  const vendor = w.hardwareWalletVendor;
  return typeof vendor === "string" && vendor.toLowerCase().includes("ledger");
}

export function WalletButton() {
  const { walletAddress, primaryWallet, showAuthFlow, logout } = useContext(WalletContext);

  // DEMO_MODE: dynamicClient is null — wallet UI is unavailable.
  // useContext is called unconditionally above, so this early return is safe.
  if (!dynamicClient) return null;

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        {isLedgerWallet(primaryWallet) && (
          <span className="flex items-center gap-1 rounded-full bg-[#edf2ff] px-2.5 py-1 text-[9px] font-bold text-[#315efb]">
            <Cpu size={9} aria-hidden="true" /> Ledger
          </span>
        )}
        <button onClick={logout} className="button-secondary !py-1.5 !text-xs">
          <Wallet size={13} aria-hidden="true" />
          {short(walletAddress)}
        </button>
      </div>
    );
  }

  return (
    <button onClick={showAuthFlow} className="button-primary">
      <Wallet size={14} aria-hidden="true" /> Connect wallet
    </button>
  );
}
