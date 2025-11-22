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
npx hardhat ignition deploy ignition/modules/MysticIsland.ts --network saga
```

This will deploy all contracts in the correct order:
1. **MagicToken** - ERC20 token
2. **ArtifactCollection** - ERC721 NFT collection
3. **TotemManager** - Totem management system
4. **QuestManager** - Quest reward system

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
- `TotemManager` - Manages totem creation and power-ups
- `QuestManager` - Handles quest reward claims

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

