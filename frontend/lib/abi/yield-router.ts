export const yieldRouterAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{ name: "protocol", type: "uint8" }],
    outputs: [{ name: "positionId", type: "uint256" }],
  },
] as const;
