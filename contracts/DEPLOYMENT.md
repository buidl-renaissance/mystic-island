# Mystic Island Contract Deployment Guide

## Prerequisites

1. Set your deployment private key as an environment variable or use Hardhat keystore:
   ```bash
   npx hardhat keystore set SAGA_PRIVATE_KEY
   ```

2. Make sure you have funds in your deployment account on the Saga chainlet.

## Network Configuration

The Saga chainlet network is configured in `hardhat.config.ts`:
- **RPC Endpoint**: `https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io`
- **Network Name**: `saga`
- **Chain ID**: Auto-detected

## Deployment Steps

### 1. Deploy All Contracts

```bash
cd contracts
npx hardhat ignition deploy MysticIsland --network saga
```

**Note:** Use just the module name (without path or `.ts` extension). Hardhat Ignition will automatically find it in `ignition/modules/`.

This will deploy all contracts in the correct order:
1. **MagicToken** - ERC20 token
2. **ArtifactCollection** - ERC721 NFT collection
3. **TribeManager** - Tribe and initiation management
4. **IslandMythos** - Realm mythos and theme registry
5. **LocationRegistry** - Location registry (requires IslandMythos)
6. **TotemManager** - Totem management system
7. **QuestManager** - Quest reward system

### 2. Post-Deployment Setup

After deployment, you'll need to:

#### Set Attestor for QuestManager

The QuestManager is deployed with the deployer as a placeholder attestor. Update it:

```bash
# Replace QUEST_MANAGER_ADDRESS and ATTESTOR_ADDRESS
npx hardhat run scripts/set-attestor.ts --network saga
```

Or manually call:
```solidity
questManager.setAttestor(attestorAddress);
```

#### Verify Contract Addresses

The deployment will output all contract addresses. Save these for your frontend/backend integration.

## Contract Addresses

After deployment, you'll receive addresses for:
- `MagicToken` - Used for powering up totems and quest rewards
- `ArtifactCollection` - NFT collection for artifacts
- `TribeManager` - Manages tribes, initiation artifacts, and member minting
- `IslandMythos` - Canonical source for realm mythos, theme, and lore
- `LocationRegistry` - Registry of named locations on the island
- `TotemManager` - Manages totem creation and power-ups
- `QuestManager` - Handles quest reward claims

**Important:** After deployment:
1. Update contract addresses in `src/utils/contracts.ts`
2. Initialize IslandMythos via the onboarding flow (`/onboarding`)
3. Create locations via the create-location page (`/create-location`)

## Testing Deployment

You can verify the deployment by checking:
- MagicToken name and symbol
- ArtifactCollection name and symbol
- TotemManager initialization
- QuestManager attestor address

## Network Details

- **Chainlet ID**: `mysticisland_2763823383026000-1`
- **Block Explorer**: https://mysticisland-2763823383026000-1.sagaexplorer.io
- **RPC**: https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io
- **WebSocket**: https://mysticisland-2763823383026000-1.ws.sagarpc.io

