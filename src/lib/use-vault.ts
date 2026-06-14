"use client";

import { useCallback, useContext } from "react";
import { isEvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import type { WalletAccount } from "@dynamic-labs-sdk/client";
import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { baseSepolia } from "viem/chains";

import { WalletContext } from "@/components/app-providers";
import { GUARDED_VAULT_ABI } from "@/lib/contracts";

const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_GUARDED_VAULT_ADDRESS ?? "") as `0x${string}`;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
});

async function getWalletClient(wallet: unknown) {
  const walletAccount = wallet as WalletAccount;
  if (!isEvmWalletAccount(walletAccount)) {
    throw new Error("Connect an EVM-compatible wallet (MetaMask, Ledger, etc.).");
  }
  return createWalletClientForWalletAccount({ walletAccount });
}

export interface VaultHook {
  walletConnected: boolean;
  walletAddress: string | null;
  queueTransfer: (
    recipient: `0x${string}`,
    amountEth: number,
    delaySeconds: number,
  ) => Promise<{ txHash: `0x${string}`; intentId: `0x${string}` }>;
  cancelIntent: (intentId: `0x${string}`) => Promise<`0x${string}`>;
  executeIntent: (intentId: `0x${string}`) => Promise<`0x${string}`>;
}

export function useVault(): VaultHook {
  const { primaryWallet, walletAddress } = useContext(WalletContext);
  const walletConnected = Boolean(primaryWallet);

  const queueTransfer = useCallback(
    async (
      recipient: `0x${string}`,
      amountEth: number,
      delaySeconds: number,
    ): Promise<{ txHash: `0x${string}`; intentId: `0x${string}` }> => {
      if (!primaryWallet || !VAULT_ADDRESS) {
        throw new Error("Wallet not connected or vault address not configured.");
      }
      const walletClient = await getWalletClient(primaryWallet);
      const executeAfter = BigInt(Math.floor(Date.now() / 1000) + delaySeconds);
      const data = encodeFunctionData({
        abi: GUARDED_VAULT_ABI,
        functionName: "queueTransfer",
        args: [recipient, executeAfter],
      });
      const txHash = (await walletClient.sendTransaction({
        to: VAULT_ADDRESS,
        data,
        value: parseEther(String(amountEth)),
        chain: baseSepolia,
        account: walletClient.account!,
      })) as `0x${string}`;
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      // IntentQueued event: topics[0]=sig, topics[1]=intentId (indexed bytes32)
      const intentId = (receipt.logs[0]?.topics[1] ?? "0x00") as `0x${string}`;
      return { txHash, intentId };
    },
    [primaryWallet],
  );

  const cancelIntent = useCallback(
    async (intentId: `0x${string}`): Promise<`0x${string}`> => {
      if (!primaryWallet || !VAULT_ADDRESS) {
        throw new Error("Wallet not connected or vault address not configured.");
      }
      const walletClient = await getWalletClient(primaryWallet);
      const data = encodeFunctionData({
        abi: GUARDED_VAULT_ABI,
        functionName: "cancelIntent",
        args: [intentId],
      });
      return walletClient.sendTransaction({
        to: VAULT_ADDRESS,
        data,
        chain: baseSepolia,
        account: walletClient.account!,
      }) as Promise<`0x${string}`>;
    },
    [primaryWallet],
  );

  const executeIntent = useCallback(
    async (intentId: `0x${string}`): Promise<`0x${string}`> => {
      if (!primaryWallet || !VAULT_ADDRESS) {
        throw new Error("Wallet not connected or vault address not configured.");
      }
      const walletClient = await getWalletClient(primaryWallet);
      const data = encodeFunctionData({
        abi: GUARDED_VAULT_ABI,
        functionName: "executeIntent",
        args: [intentId],
      });
      return walletClient.sendTransaction({
        to: VAULT_ADDRESS,
        data,
        chain: baseSepolia,
        account: walletClient.account!,
      }) as Promise<`0x${string}`>;
    },
    [primaryWallet],
  );

  return { walletConnected, walletAddress, queueTransfer, cancelIntent, executeIntent };
}
