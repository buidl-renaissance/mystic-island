import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to grant minter role on MagicToken to an address
 * 
 * Usage:
 * npx hardhat run scripts/grant-magic-minter.ts --network saga
 * 
 * Or with custom address:
 * ADDRESS=0x... npx hardhat run scripts/grant-magic-minter.ts --network saga
 */

// Contract address for MagicToken
const MAGIC_TOKEN_ADDRESS = "0xFb1586097811Cc5040191376ac680e6d8a73d8b2";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get address from environment variable or default to deployer
  // Note: When run via hardhat, argv[2] is "run", so we only check env vars
  const addressToGrant = process.env.ADDRESS || deployer.address;
  
  // Validate address format
  if (!ethers.isAddress(addressToGrant)) {
    console.error("❌ Error: Invalid address format:", addressToGrant);
    process.exit(1);
  }
  
  console.log("🔐 Granting MagicToken minter role...");
  console.log("=" .repeat(60));
  console.log("📍 MagicToken:", MAGIC_TOKEN_ADDRESS);
  console.log("👤 Deployer address:", deployer.address);
  console.log("🎯 Address to grant minter:", addressToGrant);
  console.log("");
  
  try {
    // Load the MagicToken contract
    const MagicToken = await ethers.getContractFactory("MagicToken");
    const magicToken = MagicToken.attach(MAGIC_TOKEN_ADDRESS);
    
    // Check if address already has minter role
    const isMinter = await magicToken.isMinter(addressToGrant);
    
    if (isMinter) {
      console.log("✅ Address already has minter role");
      console.log("");
      console.log("=" .repeat(60));
      return;
    }
    
    // Check if deployer is owner
    const owner = await magicToken.owner();
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error("❌ Error: Deployer address is not the owner of MagicToken");
      console.error("   Owner:", owner);
      console.error("   Deployer:", deployer.address);
      console.error("Only the owner can grant minter role");
      process.exit(1);
    }
    
    console.log("✅ Deployer is owner of MagicToken");
    console.log("⏳ Granting minter role...");
    
    // Grant the minter role
    const tx = await magicToken.setMinter(addressToGrant, true);
    console.log("📝 Transaction hash:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    if (receipt) {
      console.log("✅ Successfully granted minter role!");
      console.log("   Block number:", receipt.blockNumber);
      console.log("   Gas used:", receipt.gasUsed.toString());
      
      // Verify the role was granted
      const isMinterAfter = await magicToken.isMinter(addressToGrant);
      if (isMinterAfter) {
        console.log("✅ Verified: Address now has minter role");
      } else {
        console.log("⚠️  Warning: Minter role verification failed");
      }
    }
    
    console.log("");
    console.log("=" .repeat(60));
    
  } catch (error) {
    console.error("❌ Error granting minter role:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

