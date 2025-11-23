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
  MAGIC_TOKEN: "0xFb1586097811Cc5040191376ac680e6d8a73d8b2",
  ARTIFACT_COLLECTION: "0x026B95562bFc5595338CCF086031002030d432b6",
  TRIBE_MANAGER: "0xa83210c8a77BbD021d65d8877D0F69182132339B",
  TOTEM_MANAGER: "0x065f0cd076d85eA1811530015915Fd2826f143F4",
  QUEST_MANAGER: "0x961dC01330b6f554b10aB75952424Bc343065733",
  ISLAND_MYTHOS: "0x2201c8897b855Fb25Ff019EBa1De8F28F6e723E6", // TODO: Deploy and update
  LOCATION_REGISTRY: "0x1A21d327041601670269540541e2717bc2BfDa24", // TODO: Deploy and update
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

export const ISLAND_MYTHOS_ABI = [
  {
    inputs: [],
    name: "isInitialized",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isLocked",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "islandName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "shortTheme",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "artDirection",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "coreMyth",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "loreURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMythos",
    outputs: [
      {
        components: [
          { name: "islandName", type: "string" },
          { name: "shortTheme", type: "string" },
          { name: "artDirection", type: "string" },
          { name: "coreMyth", type: "string" },
          { name: "loreURI", type: "string" },
          { name: "initialized", type: "bool" },
          { name: "locked", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "islandName", type: "string" },
      { name: "shortTheme", type: "string" },
      { name: "artDirection", type: "string" },
      { name: "coreMyth", type: "string" },
      { name: "loreURI", type: "string" },
    ],
    name: "initializeMythos",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const LOCATION_REGISTRY_ABI = [
  {
    inputs: [],
    name: "totalLocations",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "getLocation",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "slug", type: "string" },
          { name: "displayName", type: "string" },
          { name: "description", type: "string" },
          { name: "biome", type: "uint8" },
          { name: "difficulty", type: "uint8" },
          { name: "parentLocationId", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "sceneURI", type: "string" },
          { name: "controller", type: "address" },
          { name: "metadataURI", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "slug", type: "string" }],
    name: "getLocationBySlug",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "slug", type: "string" },
          { name: "displayName", type: "string" },
          { name: "description", type: "string" },
          { name: "biome", type: "uint8" },
          { name: "difficulty", type: "uint8" },
          { name: "parentLocationId", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "sceneURI", type: "string" },
          { name: "controller", type: "address" },
          { name: "metadataURI", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "slug", type: "string" },
      { name: "displayName", type: "string" },
      { name: "description", type: "string" },
      { name: "biome", type: "uint8" },
      { name: "difficulty", type: "uint8" },
      { name: "parentLocationId", type: "uint256" },
      { name: "sceneURI", type: "string" },
      { name: "controller", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    name: "createLocation",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

