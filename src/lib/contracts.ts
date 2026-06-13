export const GUARDED_VAULT_ABI = [
  {
    type: "function",
    name: "queueTransfer",
    stateMutability: "payable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "executeAfter", type: "uint64" },
    ],
    outputs: [{ name: "intentId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "cancelIntent",
    stateMutability: "nonpayable",
    inputs: [{ name: "intentId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "executeIntent",
    stateMutability: "nonpayable",
    inputs: [{ name: "intentId", type: "bytes32" }],
    outputs: [],
  },
] as const;

export const PASSPORT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "nullifierHash", type: "bytes32" },
      { name: "score", type: "uint16" },
      { name: "skillMask", type: "uint32" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;
