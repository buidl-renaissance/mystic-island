# How to Reset Your Saga Chainlet

## Important Note
**Saga chainlets cannot be reset or cleared.** They are persistent blockchain networks. To start fresh, you need to create a **new chainlet**.

## Option 1: Create a New Chainlet (Recommended)

### Step 1: Create New Chainlet via Saga Web App
1. Go to the [Saga Web App](https://app.saga.xyz)
2. Navigate to your chainlets dashboard
3. Click "Create New Chainlet" or similar option
4. Configure your new chainlet:
   - **Name**: Choose a new name (e.g., `mysticisland-v2`)
   - **Stack Type**: SagaOS 0.10.0 (or latest)
   - **Gas Configuration**: Set as needed
   - **Deployment Auth**: Configure as needed

### Step 2: Update Configuration Files

After creating the new chainlet, update these files with the new chainlet details:

#### 1. Update `contracts/SAGA_CHAINLET_CONFIG.md`
Replace the chainlet ID, RPC URL, chain ID, and explorer URL with your new chainlet's information.

#### 2. Update `contracts/hardhat.config.ts`
```typescript
saga: {
  type: "http",
  chainType: "l1",
  url: "https://YOUR-NEW-CHAINLET-ID.jsonrpc.sagarpc.io", // Update this
  accounts: [configVariable("SAGA_PRIVATE_KEY")],
  chainId: YOUR_NEW_CHAIN_ID, // Update this
}
```

#### 3. Update `src/utils/contracts.ts`
```typescript
export const SAGA_CHAINLET = {
  id: YOUR_NEW_CHAIN_ID, // Update this
  name: "Saga Chainlet",
  network: "saga-chainlet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://YOUR-NEW-CHAINLET-ID.jsonrpc.sagarpc.io"], // Update this
    },
    // ... rest of config
  },
  blockExplorers: {
    default: {
      name: "Saga Explorer",
      url: "https://YOUR-NEW-CHAINLET-ID.sagaexplorer.io", // Update this
    },
  },
} as const;
```

### Step 3: Fund Your Deployment Wallet
Make sure your deployment wallet (`0x7c56398b74c4619Bec4F13e8E80dEa0F578A03D4` or your new one) has funds on the new chainlet for gas.

### Step 4: Deploy Fresh Contracts
```bash
cd contracts
npx hardhat ignition deploy MysticIsland --network saga
```

### Step 5: Update Contract Addresses
After deployment, run:
```bash
yarn deploy:update-addresses
```

Or manually update `src/utils/contracts.ts` with the new contract addresses.

## Option 2: Keep Current Chainlet, Clear Data via Contracts

If you want to keep the same chainlet but start fresh, you can:

1. **Deactivate all locations** (if your contracts support it)
2. **Reset contract state** (if your contracts have admin reset functions)
3. **Deploy new contract instances** on the same chainlet

However, this won't clear transaction history or other on-chain data.

## Option 3: Archive Current Chainlet

You can keep your current chainlet (`mysticisland_2763823383026000-1`) for reference and create a new one for active development.

## Recommended Approach

For a clean start with the new location creation workflow:

1. **Create a new chainlet** via Saga Web App
2. **Update all configuration files** with new chainlet details
3. **Deploy fresh contracts** to the new chainlet
4. **Use the admin tool** to create locations in the order you want

This gives you a completely fresh start while keeping your old chainlet for reference.

## Notes

- The old chainlet will remain accessible at its original RPC endpoint
- You can switch between chainlets by updating the configuration
- Make sure to update any environment variables or deployment scripts
- Consider documenting which chainlet is "active" vs "archived"

