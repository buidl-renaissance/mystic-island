# 🎉 Deployed Contracts - Mystic Island

**Deployment Date:** November 23, 2025
**Network:** Saga Chainlet (mysticisland_2763823383026000-1)  
**Deployer:** TBD (New wallet - see deployment instructions)

## 📋 Contract Addresses

### MagicToken (ERC20)
```
0xFb1586097811Cc5040191376ac680e6d8a73d8b2
```
- **Name:** Magic
- **Symbol:** MAGIC
- **Purpose:** Fungible token for powering up totems and quest rewards

### ArtifactCollection (ERC721)
```
0x026B95562bFc5595338CCF086031002030d432b6
```
- **Name:** Artifact
- **Symbol:** ARTIFACT
- **Purpose:** NFT collection for unique artifacts that can be combined into totems

### TribeManager
```
0xa83210c8a77BbD021d65d8877D0F69182132339B
```
- **Purpose:** Manages tribes, initiation artifacts, and member artifact minting
- **Dependencies:** ArtifactCollection

### TotemManager
```
0x065f0cd076d85eA1811530015915Fd2826f143F4
```
- **Purpose:** Manages totem creation, artifact binding, and power-ups
- **Dependencies:** MagicToken, ArtifactCollection

### QuestManager
```
0x961dC01330b6f554b10aB75952424Bc343065733
```
- **Purpose:** Handles quest reward claims with signature verification
- **Dependencies:** MagicToken
- **Status:** Will be set as minter for MagicToken after deployment
- **Attestor:** TBD (can be updated after deployment)

### IslandMythos
```
0x2201c8897b855Fb25Ff019EBa1De8F28F6e723E6
```
- **Purpose:** Canonical source of truth for the island's mythos, theme, and lore
- **Status:** Must be initialized before locations can be created

### LocationRegistry
```
0x1A21d327041601670269540541e2717bc2BfDa24
```
- **Purpose:** Registry of named locations on the island
- **Dependencies:** IslandMythos

## 🔗 Links

- **Block Explorer:** https://mysticisland-2763823383026000-1.sagaexplorer.io
- **RPC Endpoint:** https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io
- **WebSocket:** https://mysticisland-2763823383026000-1.ws.sagarpc.io

## ✅ Deployment Status

(- [x]) MagicToken deployed
(- [x]) ArtifactCollection deployed
(- [x]) TribeManager deployed
(- [x]) TotemManager deployed
(- [x]) QuestManager deployed
(- [x]) IslandMythos deployed
(- [x]) LocationRegistry deployed
- [ ] QuestManager set as minter for MagicToken
- [ ] TribeManager set as minter for ArtifactCollection
- [ ] IslandMythos initialized

## 📝 Next Steps

### 1. Update QuestManager Attestor (Optional)

If you want to use a different address as the attestor for signing quest completions:

```bash
cd contracts
export QUEST_MANAGER_ADDRESS="0x3bDc1b8269A305B1FF5eD3D304279537662082e2"
export ATTESTOR_ADDRESS="<your-attestor-address>"
npx hardhat run scripts/set-attestor.ts --network saga
```

### 2. Integrate with Frontend/Backend

Add these addresses to your application configuration:

```typescript
export const CONTRACTS = {
  MAGIC_TOKEN: "0xE04D9c01FeBe5c1600Fb983666e3692955625d81",
  ARTIFACT_COLLECTION: "0xf7423c4b7645e55d80E50Ea9eE0F1D1E03B172AE",
  TOTEM_MANAGER: "0x37B5E7D858c9F751b91821D00F89d4A4dA117d7a",
  QUEST_MANAGER: "0x3bDc1b8269A305B1FF5eD3D304279537662082e2",
};
```

### 3. Verify Contracts (Optional)

You can verify the contracts on the block explorer if needed.

## 🎮 Contract Usage

### MagicToken
- Mint tokens (requires minter role)
- Burn tokens
- Transfer tokens

### ArtifactCollection
- Mint artifacts (owner only)
- Transfer artifacts
- View token URIs

### TotemManager
- Create totems from artifacts
- Add artifacts to existing totems
- Power up totems with Magic tokens

### QuestManager
- Claim quest rewards with valid signatures
- Update attestor address (owner only)

## 🔒 Security Notes

- QuestManager attestor is currently set to the deployer address
- Consider using a separate attestor wallet for production
- All contracts are owned by the deployer address
- QuestManager is already set as a minter for MagicToken

