import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to add a member to a tribe by approving their join request
 * 
 * Usage:
 *   TRIBE_NAME="Warriors" MEMBER_ADDRESS="0x..." npx hardhat run scripts/add-tribe-member.ts --network saga
 * 
 * Or set environment variables:
 *   export TRIBE_NAME="Warriors"
 *   export MEMBER_ADDRESS="0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d"
 *   npx hardhat run scripts/add-tribe-member.ts --network saga
 */

async function main() {
  console.log("🔍 Finding and approving join request...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Get contract addresses
  const TRIBE_MANAGER_ADDRESS = process.env.TRIBE_MANAGER_ADDRESS || "0x61988c83D3f20505261254500526062677F2562E";
  const TRIBE_NAME = process.env.TRIBE_NAME || "Warriors";
  const MEMBER_ADDRESS = process.env.MEMBER_ADDRESS || "0xd3d47f620a4E839A7a7F7d29CAc23C08fFBE591d";

  console.log("📋 Configuration:");
  console.log("  Tribe Manager:", TRIBE_MANAGER_ADDRESS);
  console.log("  Tribe Name:", TRIBE_NAME);
  console.log("  Member Address:", MEMBER_ADDRESS);
  console.log("");

  // Load TribeManager contract
  const TribeManager = await ethers.getContractAt(
    "TribeManager",
    TRIBE_MANAGER_ADDRESS,
    deployer
  );

  // Find the Warriors tribe
  const nextTribeId = await TribeManager.nextTribeId();
  let warriorsTribeId: bigint | null = null;

  console.log("🔍 Searching for Warriors tribe...");
  for (let i = 1n; i < nextTribeId; i++) {
    try {
      const [name] = await TribeManager.getTribe(i);
      if (name === TRIBE_NAME) {
        warriorsTribeId = i;
        console.log(`✓ Found ${TRIBE_NAME} tribe with ID: ${i}`);
        break;
      }
    } catch (err) {
      // Tribe might not exist, continue
    }
  }

  if (!warriorsTribeId) {
    console.error(`❌ Tribe "${TRIBE_NAME}" not found!`);
    process.exit(1);
  }

  // Check if address is already a member
  const isAlreadyMember = await TribeManager.isTribeMember(warriorsTribeId, MEMBER_ADDRESS);
  if (isAlreadyMember) {
    console.log(`✓ Address ${MEMBER_ADDRESS} is already a member of ${TRIBE_NAME} tribe`);
    process.exit(0);
  }

  // Find pending join request from this address
  const nextRequestId = await TribeManager.nextJoinRequestId();
  let pendingRequestId: bigint | null = null;

  console.log("🔍 Searching for pending join request...");
  for (let i = 1n; i < nextRequestId; i++) {
    try {
      const [tribeId, applicant, , , processed] = await TribeManager.getJoinRequest(i);
      if (
        tribeId === warriorsTribeId &&
        applicant.toLowerCase() === MEMBER_ADDRESS.toLowerCase() &&
        !processed
      ) {
        pendingRequestId = i;
        console.log(`✓ Found pending request ID: ${i}`);
        break;
      }
    } catch (err) {
      // Request might not exist, continue
    }
  }

  if (!pendingRequestId) {
    // Try to add directly using addMemberDirectly (owner only)
    console.log(`\n💡 No pending join request found. Attempting to add member directly...`);
    try {
      const tx = await TribeManager.addMemberDirectly(warriorsTribeId, MEMBER_ADDRESS);
      console.log("⏳ Transaction hash:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✓ Transaction confirmed in block:", receipt?.blockNumber);

      // Verify membership
      const isNowMember = await TribeManager.isTribeMember(warriorsTribeId, MEMBER_ADDRESS);
      if (isNowMember) {
        console.log(`\n✅ Success! ${MEMBER_ADDRESS} is now a member of ${TRIBE_NAME} tribe`);
      } else {
        console.log(`\n⚠️  Warning: Membership verification failed. Please check manually.`);
      }
      return;
    } catch (error: any) {
      console.error("❌ Error adding member directly:", error.message);
      if (error.data) {
        console.error("Error data:", error.data);
      }
      console.log("\n💡 The address needs to submit a join request first using requestToJoinTribe()");
      process.exit(1);
    }
  }

  // Approve the join request
  console.log(`\n📝 Approving join request ${pendingRequestId}...`);
  try {
    const tx = await TribeManager.approveJoinRequest(pendingRequestId);
    console.log("⏳ Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✓ Transaction confirmed in block:", receipt?.blockNumber);

    // Verify membership
    const isNowMember = await TribeManager.isTribeMember(warriorsTribeId, MEMBER_ADDRESS);
    if (isNowMember) {
      console.log(`\n✅ Success! ${MEMBER_ADDRESS} is now a member of ${TRIBE_NAME} tribe`);
    } else {
      console.log(`\n⚠️  Warning: Membership verification failed. Please check manually.`);
    }
  } catch (error: any) {
    console.error("❌ Error approving join request:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

