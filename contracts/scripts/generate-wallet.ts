import { Wallet } from "ethers";

/**
 * Script to generate a new wallet for deployment
 * 
 * Usage:
 * npx hardhat run scripts/generate-wallet.ts
 * 
 * IMPORTANT: Save the private key and address securely!
 * You'll need to fund this address on your Saga chainlet.
 */
async function main() {
  console.log("🔐 Generating new wallet...\n");
  
  // Generate a random wallet
  const wallet = Wallet.createRandom();
  
  console.log("✅ Wallet generated successfully!\n");
  console.log("=" .repeat(60));
  console.log("📋 WALLET DETAILS - SAVE THIS INFORMATION SECURELY!");
  console.log("=" .repeat(60));
  console.log("\n📍 Address:");
  console.log(wallet.address);
  console.log("\n🔑 Private Key:");
  console.log(wallet.privateKey);
  console.log("\n" + "=" .repeat(60));
  console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
  console.log("1. Keep your private key SECRET and NEVER share it");
  console.log("2. Save this information in a secure location");
  console.log("3. You'll need to fund this address on your Saga chainlet");
  console.log("4. Use this private key to set up SAGA_PRIVATE_KEY\n");
  
  console.log("📝 Next Steps:");
  console.log("1. Copy the private key above");
  console.log("2. Run: npx hardhat keystore set SAGA_PRIVATE_KEY");
  console.log("3. Paste the private key when prompted");
  console.log("4. Fund the address on your Saga chainlet");
  console.log("5. Deploy your contracts!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

