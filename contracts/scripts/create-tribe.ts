import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to create a new tribe
 * 
 * Usage:
 * SAGA_PRIVATE_KEY=0x... npx hardhat run scripts/create-tribe.ts --network saga
 * 
 * Or set in environment:
 * export SAGA_PRIVATE_KEY=0x...
 * npx hardhat run scripts/create-tribe.ts --network saga
 * 
 * You can also pass tribe details as environment variables:
 * TRIBE_NAME="Warriors" TRIBE_LEADER=0x... npx hardhat run scripts/create-tribe.ts --network saga
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🏛️  Creating a new tribe...");
  console.log("=".repeat(60));
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("=".repeat(60));
  console.log("");

  // Get contract addresses from environment or use defaults
  const TRIBE_MANAGER_ADDRESS = process.env.TRIBE_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (TRIBE_MANAGER_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Error: TRIBE_MANAGER_ADDRESS not set");
    console.error("Please set TRIBE_MANAGER_ADDRESS environment variable");
    console.error("Example: TRIBE_MANAGER_ADDRESS=0x... npx hardhat run scripts/create-tribe.ts --network saga");
    process.exit(1);
  }

  // Get tribe details from environment or prompt
  const tribeName = process.env.TRIBE_NAME || "My Tribe";
  const tribeLeader = process.env.TRIBE_LEADER || deployer.address;
  const requiresApproval = process.env.REQUIRES_APPROVAL !== "false"; // Default to true
  const quorumThreshold = process.env.QUORUM_THRESHOLD 
    ? parseInt(process.env.QUORUM_THRESHOLD) 
    : 0; // 0 = leader/owner only, >0 = requires that many member approvals

  console.log("📋 Tribe Details:");
  console.log("  Name:", tribeName);
  console.log("  Leader:", tribeLeader);
  console.log("  Requires Approval:", requiresApproval);
  console.log("  Quorum Threshold:", quorumThreshold, quorumThreshold === 0 ? "(Leader/Owner only)" : `(${quorumThreshold} member approvals needed)`);
  console.log("");

  // Load TribeManager contract
  const TribeManager = await ethers.getContractFactory("TribeManager");
  const tribeManager = TribeManager.attach(TRIBE_MANAGER_ADDRESS);

  // Verify we're the owner
  const owner = await tribeManager.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("❌ Error: You are not the owner of TribeManager");
    console.error("Owner:", owner);
    console.error("Your address:", deployer.address);
    process.exit(1);
  }

  console.log("✅ Verified as owner");
  console.log("");

  // Check current tribe count
  const nextTribeId = await tribeManager.nextTribeId();
  console.log("Current number of tribes:", Number(nextTribeId) - 1);
  console.log("");

    // Create the tribe
    console.log("📝 Creating tribe...");
    try {
      const tx = await tribeManager.createTribe(tribeName, tribeLeader, requiresApproval, quorumThreshold);
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Tribe created successfully!");
    console.log("");

    // Get the new tribe ID from events
    const event = receipt.logs.find(
      (log: any) => {
        try {
          const parsed = tribeManager.interface.parseLog(log);
          return parsed?.name === "TribeCreated";
        } catch {
          return false;
        }
      }
    );

    if (event) {
      const parsed = tribeManager.interface.parseLog(event);
      const tribeId = parsed?.args[0];
      console.log("📋 New Tribe Information:");
      console.log("  Tribe ID:", tribeId.toString());
      console.log("  Name:", tribeName);
      console.log("  Leader:", tribeLeader);
      console.log("  Requires Approval:", requiresApproval);
      console.log("  Quorum Threshold:", quorumThreshold);
      console.log("");
    }

    // Verify the tribe was created
    const newNextTribeId = await tribeManager.nextTribeId();
    console.log("Total tribes now:", Number(newNextTribeId) - 1);
    console.log("");

    console.log("=".repeat(60));
    console.log("🎉 TRIBE CREATION COMPLETE!");
    console.log("=".repeat(60));
    console.log("");
    console.log("💡 Next Steps:");
    console.log("  1. Share the tribe ID with potential members");
    console.log("  2. Members can now request to join at /join-tribe");
    console.log("  3. You can approve/reject requests as the tribe leader");
    console.log("");
  } catch (error) {
    console.error("❌ Error creating tribe:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

