# Deployment Steps for Mystic Island Contracts

## Prerequisites Checklist

- [ ] Private key set up (see Step 1 below)
- [ ] Account has funds on Saga chainlet for gas
- [ ] Contracts compiled successfully

## Step-by-Step Deployment

### Step 1: Set Your Private Key

**Option A - Hardhat Keystore (Recommended):**
```bash
cd contracts
npx hardhat keystore set SAGA_PRIVATE_KEY
```
Enter your private key when prompted (it will be stored securely).

**Option B - Environment Variable:**
```bash
export SAGA_PRIVATE_KEY="0x..."
```

### Step 2: Test Network Connection

Verify your connection and check your balance:
```bash
npx hardhat run scripts/check-network.ts --network saga
```

This will show:
- Your deployer address
- Your account balance
- Network chain ID
- Current block number

### Step 3: Deploy Contracts

Deploy all contracts:
```bash
npx hardhat ignition deploy ignition/modules/MysticIsland.ts --network saga
```

This will:
1. Deploy MagicToken
2. Deploy ArtifactCollection  
3. Deploy TotemManager
4. Deploy QuestManager
5. Set QuestManager as a minter for MagicToken

### Step 4: Save Contract Addresses

After deployment, you'll see output like:
```
Deployed MagicToken at: 0x...
Deployed ArtifactCollection at: 0x...
Deployed TotemManager at: 0x...
Deployed QuestManager at: 0x...
```

**Save these addresses!** You'll need them for your frontend/backend.

### Step 5: Update Attestor (Optional)

If you want to use a different address as the attestor for QuestManager:

```bash
export QUEST_MANAGER_ADDRESS="<deployed-address>"
export ATTESTOR_ADDRESS="<attestor-address>"
npx hardhat run scripts/set-attestor.ts --network saga
```

### Step 6: Verify on Block Explorer

Visit your block explorer to verify the contracts:
https://mysticisland-2763823383026000-1.sagaexplorer.io

## Network Details

- **RPC**: https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io
- **Block Explorer**: https://mysticisland-2763823383026000-1.sagaexplorer.io
- **Chainlet ID**: mysticisland_2763823383026000-1

## Troubleshooting

**Error: "insufficient funds"**
- Make sure your account has enough ETH for gas fees

**Error: "nonce too high"**
- Wait a moment and try again, or reset your account nonce

**Error: "network connection failed"**
- Verify the RPC endpoint is correct and accessible

