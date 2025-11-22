/**
 * Contract addresses and ABIs for Mystic Island
 * Deployed on Saga Chainlet: mysticisland_2763823383026000-1
 */

export const SAGA_CHAINLET = {
  id: 2763823383026000,
  name: "Saga Chainlet",
  network: "saga-chainlet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io"],
    },
    public: {
      http: ["https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Saga Explorer",
      url: "https://mysticisland-2763823383026000-1.sagaexplorer.io",
    },
  },
} as const;

export const CONTRACT_ADDRESSES = {
  MAGIC_TOKEN: "0xE04D9c01FeBe5c1600Fb983666e3692955625d81",
  ARTIFACT_COLLECTION: "0xf7423c4b7645e55d80E50Ea9eE0F1D1E03B172AE",
  TRIBE_MANAGER: "0x61988c83D3f20505261254500526062677F2562E",
  TOTEM_MANAGER: "0x37B5E7D858c9F751b91821D00F89d4A4dA117d7a",
  QUEST_MANAGER: "0x3bDc1b8269A305B1FF5eD3D304279537662082e2",
  ISLAND_MYTHOS: "0x0000000000000000000000000000000000000000", // TODO: Deploy and update
  LOCATION_REGISTRY: "0x0000000000000000000000000000000000000000", // TODO: Deploy and update
} as const;

// Minimal ABIs for reading contract data
export const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC721_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const TOTEM_MANAGER_ABI = [
  {
    inputs: [],
    name: "nextTotemId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const QUEST_MANAGER_ABI = [
  {
    inputs: [],
    name: "attestor",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const TRIBE_MANAGER_ABI = [
  {
    inputs: [],
    name: "nextTribeId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextJoinRequestId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

