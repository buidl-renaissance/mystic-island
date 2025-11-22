# Adding Members to Tribes

## Current Situation

The address `0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d` needs to be added to the Warriors tribe, but:

1. **No pending join request exists** - The address hasn't submitted a join request yet
2. **Contract needs update** - A new `addMemberDirectly()` function has been added to the contract but hasn't been deployed yet

## Options

### Option 1: Redeploy TribeManager (Recommended for Direct Addition)

The contract has been updated with an `addMemberDirectly()` function that allows the owner to directly add members without requiring a join request. However, this requires redeploying the TribeManager contract.

**Note:** Redeploying will create a new contract address, so you'll need to:
- Update the contract address in your frontend (`src/utils/contracts.ts`)
- Update any other references to the TribeManager address
- Re-create any tribes (or migrate them)

### Option 2: Wait for Join Request

Have the address `0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d` submit a join request through the frontend (`/join-tribe` page), then approve it using:

```bash
cd contracts
TRIBE_NAME="Warriors" MEMBER_ADDRESS="0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d" npx hardhat run scripts/add-tribe-member.ts --network saga
```

### Option 3: Manual Contract Interaction

If you have access to the address's wallet, you can have them:
1. Go to `/join-tribe`
2. Select "Warriors" tribe
3. Upload an initiation artifact image
4. Submit the join request
5. Then approve it using the script above

## Script Usage

Once a join request exists or the contract is redeployed, use:

```bash
cd contracts
TRIBE_NAME="Warriors" MEMBER_ADDRESS="0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d" npx hardhat run scripts/add-tribe-member.ts --network saga
```

The script will:
1. Find the Warriors tribe
2. Check if the address is already a member
3. Look for a pending join request
4. If found, approve it
5. If not found and contract has `addMemberDirectly`, use that function
6. Verify the membership was added successfully

