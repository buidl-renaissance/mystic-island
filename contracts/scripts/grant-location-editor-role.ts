import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to grant LOCATION_EDITOR_ROLE to an address
 * 
 * Usage:
 * npx hardhat run scripts/grant-location-editor-role.ts --network saga
 * 
 * Or with custom address:
 * ADDRESS=0x9009d86b870c9520bf5d7a671c38e413e4ad5114 npx hardhat run scripts/grant-location-editor-role.ts --network saga
 */

// Contract address for LocationRegistry
const LOCATION_REGISTRY_ADDRESS = "0x1A21d327041601670269540541e2717bc2BfDa24";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get address from environment variable or use first argument
  const addressToGrant = process.env.ADDRESS || process.argv[2];
  
  if (!addressToGrant) {
    console.error("❌ Error: Please provide an address to grant the role to.");
    console.error("Usage: ADDRESS=0x... npx hardhat run scripts/grant-location-editor-role.ts --network saga");
    console.error("Or: npx hardhat run scripts/grant-location-editor-role.ts --network saga 0x...");
    process.exit(1);
  }
  
  // Validate address format
  if (!ethers.isAddress(addressToGrant)) {
    console.error("❌ Error: Invalid address format:", addressToGrant);
    process.exit(1);
  }
  
  console.log("🔐 Granting LOCATION_EDITOR_ROLE...");
  console.log("=" .repeat(60));
  console.log("📍 LocationRegistry:", LOCATION_REGISTRY_ADDRESS);
  console.log("👤 Deployer (admin):", deployer.address);
  console.log("🎯 Address to grant role:", addressToGrant);
  console.log("");
  
  try {
    // Load the LocationRegistry contract
    const LocationRegistry = await ethers.getContractFactory("LocationRegistry");
    const locationRegistry = LocationRegistry.attach(LOCATION_REGISTRY_ADDRESS);
    
    // Get the LOCATION_EDITOR_ROLE hash
    const LOCATION_EDITOR_ROLE = await locationRegistry.LOCATION_EDITOR_ROLE();
    console.log("📋 LOCATION_EDITOR_ROLE hash:", LOCATION_EDITOR_ROLE);
    
    // Check if address already has the role
    const hasRole = await locationRegistry.hasRole(LOCATION_EDITOR_ROLE, addressToGrant);
    
    if (hasRole) {
      console.log("✅ Address already has LOCATION_EDITOR_ROLE");
      console.log("");
      console.log("=" .repeat(60));
      return;
    }
    
    // Check if deployer is admin
    const DEFAULT_ADMIN_ROLE = await locationRegistry.DEFAULT_ADMIN_ROLE();
    const isAdmin = await locationRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    
    if (!isAdmin) {
      console.error("❌ Error: Deployer address does not have ADMIN_ROLE");
      console.error("Only admins can grant LOCATION_EDITOR_ROLE");
      process.exit(1);
    }
    
    console.log("⏳ Granting role...");
    
    // Grant the role
    const tx = await locationRegistry.grantRole(LOCATION_EDITOR_ROLE, addressToGrant);
    console.log("📝 Transaction hash:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    if (receipt) {
      console.log("✅ Successfully granted LOCATION_EDITOR_ROLE!");
      console.log("   Block number:", receipt.blockNumber);
      console.log("   Gas used:", receipt.gasUsed.toString());
      
      // Verify the role was granted
      const hasRoleAfter = await locationRegistry.hasRole(LOCATION_EDITOR_ROLE, addressToGrant);
      if (hasRoleAfter) {
        console.log("✅ Verified: Address now has LOCATION_EDITOR_ROLE");
      } else {
        console.log("⚠️  Warning: Role verification failed");
      }
    }
    
    console.log("");
    console.log("=" .repeat(60));
    
  } catch (error) {
    console.error("❌ Error granting role:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
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

