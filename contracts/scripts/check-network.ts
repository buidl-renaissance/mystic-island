import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to check network connection and account balance
 * 
 * Usage:
 * npx hardhat run scripts/check-network.ts --network saga
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔍 Checking Saga chainlet connection...");
  console.log("=" .repeat(60));
  
  try {
    // Get network info first
    const networkInfo = await ethers.provider.getNetwork();
    const chainId = networkInfo.chainId.toString();
    
    console.log("📍 Network Details:");
    console.log("  Chainlet ID: mysticisland_2763823383026000-1");
    console.log("  Chain ID:", chainId);
    console.log("  RPC:", "https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io");
    console.log("  Block Explorer:", "https://mysticisland-2763823383026000-1.sagaexplorer.io");
    console.log("");
    
    console.log("👤 Deployer Account:");
    console.log("  Address:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log("  Balance:", balanceInEth, "ETH");
    console.log("");
    
    if (balance === 0n) {
      console.log("⚠️  WARNING: Account has zero balance!");
      console.log("  You need to fund this address to deploy contracts.");
      console.log("  Send ETH to:", deployer.address);
    } else {
      const balanceNum = parseFloat(balanceInEth);
      if (balanceNum < 0.001) {
        console.log("⚠️  WARNING: Low balance. Consider adding more funds for deployment.");
      } else {
        console.log("✅ Account has sufficient balance for deployment");
      }
    }
    
    // Get block number
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("");
    console.log("📦 Network Status:");
    console.log("  Current block:", blockNumber);
    console.log("  Connection: ✅ Connected");
    console.log("");
    console.log("=" .repeat(60));
    
  } catch (error) {
    console.error("❌ Error connecting to network:", error);
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

