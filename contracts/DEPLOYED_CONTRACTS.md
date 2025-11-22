# 🎉 Deployed Contracts - Mystic Island

**Deployment Date:** November 22, 2025  
**Network:** Saga Chainlet (mysticisland_2763823383026000-1)  
**Deployer:** 0x7c56398b74c4619Bec4F13e8E80dEa0F578A03D4

## 📋 Contract Addresses

### MagicToken (ERC20)
```
0xE04D9c01FeBe5c1600Fb983666e3692955625d81
```
- **Name:** Magic
- **Symbol:** MAGIC
- **Purpose:** Fungible token for powering up totems and quest rewards

### ArtifactCollection (ERC721)
```
0xf7423c4b7645e55d80E50Ea9eE0F1D1E03B172AE
```
- **Name:** Artifact
- **Symbol:** ARTIFACT
- **Purpose:** NFT collection for unique artifacts that can be combined into totems

### TotemManager
```
0x37B5E7D858c9F751b91821D00F89d4A4dA117d7a
```
- **Purpose:** Manages totem creation, artifact binding, and power-ups
- **Dependencies:** MagicToken, ArtifactCollection

### QuestManager
```
0x3bDc1b8269A305B1FF5eD3D304279537662082e2
```
- **Purpose:** Handles quest reward claims with signature verification
- **Dependencies:** MagicToken
- **Status:** Set as minter for MagicToken ✅
- **Attestor:** Currently set to deployer address (can be updated)

## 🔗 Links

- **Block Explorer:** https://mysticisland-2763823383026000-1.sagaexplorer.io
- **RPC Endpoint:** https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io
- **WebSocket:** https://mysticisland-2763823383026000-1.ws.sagarpc.io

## ✅ Deployment Status

- [x] MagicToken deployed
- [x] ArtifactCollection deployed
- [x] TotemManager deployed
- [x] QuestManager deployed
- [x] QuestManager set as minter for MagicToken

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

