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

// Lord Smearingon's Gallery chainlet configuration
// TODO: Update with actual chainlet ID, RPC URL, and explorer URL after deployment
export const LORD_SMEARINGON_CHAINLET = {
  id: 0, // TODO: Replace with actual chainlet ID
  name: "Lord Smearingon's Gallery",
  network: "lord-smearingon-gallery",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [""], // TODO: Replace with actual RPC URL
    },
    public: {
      http: [""], // TODO: Replace with actual RPC URL
    },
  },
  blockExplorers: {
    default: {
      name: "Saga Explorer",
      url: "", // TODO: Replace with actual explorer URL
    },
  },
} as const;

// Chainlet registry mapping chainlet ID to configuration
export const CHAINLET_REGISTRY: Record<number, typeof SAGA_CHAINLET> = {
  [SAGA_CHAINLET.id]: SAGA_CHAINLET,
  [LORD_SMEARINGON_CHAINLET.id]: LORD_SMEARINGON_CHAINLET,
};

export const CONTRACT_ADDRESSES = {
  MAGIC_TOKEN: "0xFb1586097811Cc5040191376ac680e6d8a73d8b2",
  ARTIFACT_COLLECTION: "0x026B95562bFc5595338CCF086031002030d432b6",
  TRIBE_MANAGER: "0xa83210c8a77BbD021d65d8877D0F69182132339B",
  TOTEM_MANAGER: "0x065f0cd076d85eA1811530015915Fd2826f143F4",
  QUEST_MANAGER: "0x961dC01330b6f554b10aB75952424Bc343065733",
  ISLAND_MYTHOS: "0x2201c8897b855Fb25Ff019EBa1De8F28F6e723E6", // TODO: Deploy and update
  LOCATION_REGISTRY: "0x1A21d327041601670269540541e2717bc2BfDa24", // TODO: Deploy and update
  LOCATION_UNLOCK: "0x88caa1006039ab74337CF62bae272a4ca29Bd95c",
  PORTAL: "0x31F4acCa1E06CD861F8D40282B2361498Bfd666A",
} as const;

// Contract addresses for Lord Smearingon's Gallery chainlet
// TODO: Update with actual addresses after deployment
export const GALLERY_CONTRACT_ADDRESSES = {
  MAGIC_TOKEN: "0xFb1586097811Cc5040191376ac680e6d8a73d8b2",
  ARTIFACT_COLLECTION: "0x026B95562bFc5595338CCF086031002030d432b6",
  TRIBE_MANAGER: "0xa83210c8a77BbD021d65d8877D0F69182132339B",
  TOTEM_MANAGER: "0x065f0cd076d85eA1811530015915Fd2826f143F4",
  QUEST_MANAGER: "0x961dC01330b6f554b10aB75952424Bc343065733",
  ISLAND_MYTHOS: "0x2201c8897b855Fb25Ff019EBa1De8F28F6e723E6",
  LOCATION_REGISTRY: "0x1A21d327041601670269540541e2717bc2BfDa24",
  LOCATION_UNLOCK: "0x88caa1006039ab74337CF62bae272a4ca29Bd95c",
  PORTAL: "0x31F4acCa1E06CD861F8D40282B2361498Bfd666A",
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
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
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
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
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
  {
    inputs: [{ name: "totemId", type: "uint256" }],
    name: "getTotem",
    outputs: [
      { name: "id", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "power", type: "uint256" },
      { name: "artifactCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "totemId", type: "uint256" }],
    name: "getTotemArtifactIds",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "artifactId", type: "uint256" }],
    name: "artifactToTotem",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "artifactIds", type: "uint256[]" }],
    name: "createTotem",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "totemId", type: "uint256" },
      { name: "artifactId", type: "uint256" },
    ],
    name: "addArtifact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "totemId", type: "uint256" },
      { name: "magicAmount", type: "uint256" },
    ],
    name: "powerUp",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "questId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "LOCATION_EDITOR_ROLE",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [{ name: "", type: "bytes32" }],
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
    inputs: [{ name: "slug", type: "string" }],
    name: "getLocationIdBySlug",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "parentId", type: "uint256" }],
    name: "listChildren",
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
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const LOCATION_UNLOCK_ABI = [
  {
    inputs: [{ name: "locationId", type: "uint256" }],
    name: "unlockLocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "locationId", type: "uint256" },
    ],
    name: "adminUnlockLocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "locationId", type: "uint256" },
    ],
    name: "canAccessLocation",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getUnlockedLocations",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "locationId", type: "uint256" },
    ],
    name: "unlockedLocations",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getUnlockedCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PORTAL_ABI = [
  {
    inputs: [{ name: "portalId", type: "uint256" }],
    name: "activatePortal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "sourceLocationId", type: "uint256" },
      { name: "targetChainletId", type: "uint256" },
      { name: "targetLocationSlug", type: "string" },
    ],
    name: "createPortal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "portalId", type: "uint256" }],
    name: "getPortal",
    outputs: [
      {
        components: [
          { name: "sourceLocationId", type: "uint256" },
          { name: "targetChainletId", type: "uint256" },
          { name: "targetLocationSlug", type: "string" },
          { name: "isActive", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "sourceLocationId", type: "uint256" }],
    name: "findPortalBySourceLocation",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPortals",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

