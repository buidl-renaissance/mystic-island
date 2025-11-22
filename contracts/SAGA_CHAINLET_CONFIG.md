# Saga Chainlet Configuration

## Chainlet Details

- **Chainlet ID**: `mysticisland_2763823383026000-1`
- **Stack Type**: SagaOS 0.10.0
- **Chain ID**: `2763823383026000`
- **Launch Date**: 11/22/2025

## Network Endpoints

- **RPC Endpoint**: `https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io`
- **Websocket Endpoint**: `https://mysticisland-2763823383026000-1.ws.sagarpc.io`
- **Block Explorer**: `https://mysticisland-2763823383026000-1.sagaexplorer.io`

## Gas Configuration

- **Fixed Gas Price**: Disabled
- **Gas Return Account**: `0x9009D86B870C9520BF5d7a671c38E413e4Ad5114`
- **Deployment Auth**: Disabled

## Owner & Maintainers

- **Owner**: `saga1rx5qvmfgnkyfp8rztuesepxyqmjd9uqtlccgd6`
- **Maintainers**: `saga1rx5qvmfgnkyfp8rztuesepxyqmjd9uqtlccgd6`

## Hardhat Configuration

The network is configured in `hardhat.config.ts` as:

```typescript
saga: {
  type: "http",
  chainType: "l1",
  url: "https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io",
  accounts: [configVariable("SAGA_PRIVATE_KEY")],
  chainId: 2763823383026000,
}
```

## Deployment Commands

### 1. Check Network Connection
```bash
npx hardhat run scripts/check-network.ts --network saga
```

### 2. Deploy Contracts
```bash
npx hardhat ignition deploy ignition/modules/MysticIsland.ts --network saga
```

## Deployment Wallet

- **Address**: `0x7c56398b74c4619Bec4F13e8E80dEa0F578A03D4`
- **Private Key**: Stored in Hardhat keystore as `SAGA_PRIVATE_KEY`

⚠️ **Make sure this wallet is funded before deploying!**

