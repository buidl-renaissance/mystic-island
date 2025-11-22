import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Direct deployment script (alternative to Ignition)
 * 
 * Usage:
 * SAGA_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts --network saga
 * 
 * Or set in environment:
 * export SAGA_PRIVATE_KEY=0x...
 * npx hardhat run scripts/deploy.ts --network saga
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Starting deployment to Saga chainlet...");
  console.log("=" .repeat(60));
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("=" .repeat(60));
  console.log("");
  
  // 1. Deploy MagicToken
  console.log("📝 Step 1/4: Deploying MagicToken...");
  const MagicToken = await ethers.getContractFactory("MagicToken");
  const magicToken = await MagicToken.deploy(deployer.address);
  await magicToken.waitForDeployment();
  const magicTokenAddress = await magicToken.getAddress();
  console.log("✅ MagicToken deployed at:", magicTokenAddress);
  console.log("");
  
  // 2. Deploy ArtifactCollection
  console.log("📝 Step 2/5: Deploying ArtifactCollection...");
  const ArtifactCollection = await ethers.getContractFactory("ArtifactCollection");
  const artifactCollection = await ArtifactCollection.deploy(deployer.address);
  await artifactCollection.waitForDeployment();
  const artifactCollectionAddress = await artifactCollection.getAddress();
  console.log("✅ ArtifactCollection deployed at:", artifactCollectionAddress);
  console.log("");

  // 3. Deploy TribeManager
  console.log("📝 Step 3/5: Deploying TribeManager...");
  const TribeManager = await ethers.getContractFactory("TribeManager");
  const tribeManager = await TribeManager.deploy(
    deployer.address,
    artifactCollectionAddress
  );
  await tribeManager.waitForDeployment();
  const tribeManagerAddress = await tribeManager.getAddress();
  console.log("✅ TribeManager deployed at:", tribeManagerAddress);
  console.log("");

  // 4. Deploy TotemManager
  console.log("📝 Step 4/5: Deploying TotemManager...");
  const TotemManager = await ethers.getContractFactory("TotemManager");
  const totemManager = await TotemManager.deploy(
    deployer.address,
    artifactCollectionAddress,
    magicTokenAddress
  );
  await totemManager.waitForDeployment();
  const totemManagerAddress = await totemManager.getAddress();
  console.log("✅ TotemManager deployed at:", totemManagerAddress);
  console.log("");

  // 5. Deploy QuestManager
  console.log("📝 Step 5/5: Deploying QuestManager...");
  const QuestManager = await ethers.getContractFactory("QuestManager");
  const questManager = await QuestManager.deploy(
    deployer.address,
    magicTokenAddress,
    deployer.address // Using deployer as attestor (can be updated later)
  );
  await questManager.waitForDeployment();
  const questManagerAddress = await questManager.getAddress();
  console.log("✅ QuestManager deployed at:", questManagerAddress);
  console.log("");

  // 6. Set minter roles
  console.log("🔧 Setting minter roles...");
  
  // Set QuestManager as minter for MagicToken
  const setMinterTx1 = await magicToken.setMinter(questManagerAddress, true);
  await setMinterTx1.wait();
  console.log("✅ QuestManager set as minter for MagicToken");
  
  // Set TribeManager as minter for ArtifactCollection
  const setMinterTx2 = await artifactCollection.setMinter(tribeManagerAddress, true);
  await setMinterTx2.wait();
  console.log("✅ TribeManager set as minter for ArtifactCollection");
  console.log("");
  
  // Summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log("  MagicToken:", magicTokenAddress);
  console.log("  ArtifactCollection:", artifactCollectionAddress);
  console.log("  TribeManager:", tribeManagerAddress);
  console.log("  TotemManager:", totemManagerAddress);
  console.log("  QuestManager:", questManagerAddress);
  console.log("");
  console.log("🔗 Block Explorer:");
  console.log("  https://mysticisland-2763823383026000-1.sagaexplorer.io");
  console.log("");
  console.log("💡 Next Steps:");
  console.log("  1. Save these addresses for your frontend/backend");
  console.log("  2. Update QuestManager attestor if needed:");
  console.log("     questManager.setAttestor(attestorAddress)");
  console.log("  3. Start using the contracts!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

