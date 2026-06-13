import { privateKeyToAccount } from "viem/accounts";
import { generatePrivateKey } from "viem/accounts";

import { decryptSecret, encryptSecret } from "./crypto";

interface PayerRecord {
  address: `0x${string}`;
  encryptedPrivateKey: string;
}

declare global {
  var __mainnetReadyPayers: Map<string, PayerRecord> | undefined;
}

const payers =
  globalThis.__mainnetReadyPayers ??
  (globalThis.__mainnetReadyPayers = new Map<string, PayerRecord>());

export function getOrCreatePayer(userId: string) {
  const existing = payers.get(userId);
  if (existing) {
    return {
      address: existing.address,
      privateKey: decryptSecret(existing.encryptedPrivateKey) as `0x${string}`,
    };
  }
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  payers.set(userId, {
    address: account.address,
    encryptedPrivateKey: encryptSecret(privateKey),
  });
  return { address: account.address, privateKey };
}
