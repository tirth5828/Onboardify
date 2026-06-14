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
  {
    type: "function",
    name: "intents",
    stateMutability: "view",
    inputs: [{ name: "intentId", type: "bytes32" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint128" },
      { name: "executeAfter", type: "uint64" },
      { name: "cancelled", type: "bool" },
      { name: "executed", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "IntentQueued",
    inputs: [
      { name: "intentId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "executeAfter", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "IntentCancelled",
    inputs: [{ name: "intentId", type: "bytes32", indexed: true }],
    anonymous: false,
  },
  {
    type: "event",
    name: "IntentExecuted",
    inputs: [{ name: "intentId", type: "bytes32", indexed: true }],
    anonymous: false,
  },
] as const;
