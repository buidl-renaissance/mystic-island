# Creating a Tribe

This guide explains how to create a new tribe using the TribeManager contract.

## Prerequisites

1. TribeManager contract must be deployed
2. You must be the owner of the TribeManager contract
3. You need the `SAGA_PRIVATE_KEY` environment variable set
4. You need the `TRIBE_MANAGER_ADDRESS` environment variable set (or update the script)

## Quick Start

### Basic Usage

```bash
cd contracts
TRIBE_MANAGER_ADDRESS=0x... npx hardhat run scripts/create-tribe.ts --network saga
```

This will create a tribe with default values:
- Name: "My Tribe"
- Leader: Your deployer address
- Requires Approval: true

### Custom Tribe Details

You can customize the tribe by setting environment variables:

```bash
TRIBE_MANAGER_ADDRESS=0x... \
TRIBE_NAME="Warriors" \
TRIBE_LEADER=0x1234567890123456789012345678901234567890 \
REQUIRES_APPROVAL=true \
npx hardhat run scripts/create-tribe.ts --network saga
```

### Environment Variables

- `TRIBE_MANAGER_ADDRESS` (required): The address of the deployed TribeManager contract
- `TRIBE_NAME` (optional): Name of the tribe (default: "My Tribe")
- `TRIBE_LEADER` (optional): Address of the tribe leader (default: your deployer address)
- `REQUIRES_APPROVAL` (optional): Whether join requests require approval (default: true, set to "false" to disable)

## Example Commands

### Create a Public Tribe (No Approval Required)

```bash
TRIBE_MANAGER_ADDRESS=0x... \
TRIBE_NAME="Public Guild" \
REQUIRES_APPROVAL=false \
npx hardhat run scripts/create-tribe.ts --network saga
```

### Create a Private Tribe with Specific Leader

```bash
TRIBE_MANAGER_ADDRESS=0x... \
TRIBE_NAME="Elite Warriors" \
TRIBE_LEADER=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
REQUIRES_APPROVAL=true \
npx hardhat run scripts/create-tribe.ts --network saga
```

## What Happens

1. The script verifies you're the owner of TribeManager
2. It creates a new tribe with the specified details
3. It returns the new tribe ID
4. Members can now request to join this tribe

## After Creating a Tribe

1. **Share the Tribe ID**: Tell potential members the tribe ID so they can select it when joining
2. **Approve Members**: As the tribe leader, you'll need to approve join requests
3. **Manage the Tribe**: You can update the leader or manage members as needed

## Troubleshooting

### Error: TRIBE_MANAGER_ADDRESS not set

Make sure you've set the environment variable:
```bash
export TRIBE_MANAGER_ADDRESS=0x...
```

### Error: You are not the owner

Only the contract owner can create tribes. Make sure you're using the correct private key.

### Error: Insufficient balance

Make sure your deployer account has enough ETH for gas fees.

## Notes

- Each tribe gets a unique ID starting from 1
- Tribe names can be any string
- The tribe leader can approve/reject join requests
- The contract owner can also approve/reject requests
- Once created, tribes are active by default

