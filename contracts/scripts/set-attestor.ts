import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to set the attestor address for QuestManager
 * 
 * Usage:
 * npx hardhat run scripts/set-attestor.ts --network saga
 * 
 * Set these environment variables:
 * - QUEST_MANAGER_ADDRESS: The deployed QuestManager contract address
 * - ATTESTOR_ADDRESS: The address that will sign quest completion messages
 */
async function main() {
  const questManagerAddress = process.env.QUEST_MANAGER_ADDRESS;
  const attestorAddress = process.env.ATTESTOR_ADDRESS;

  if (!questManagerAddress) {
    throw new Error("QUEST_MANAGER_ADDRESS environment variable is required");
  }

  if (!attestorAddress) {
    throw new Error("ATTESTOR_ADDRESS environment variable is required");
  }

  console.log(`Setting attestor for QuestManager at ${questManagerAddress}`);
  console.log(`New attestor address: ${attestorAddress}`);

  const questManager = await ethers.getContractAt(
    "QuestManager",
    questManagerAddress
  );

  const tx = await questManager.setAttestor(attestorAddress);
  console.log(`Transaction hash: ${tx.hash}`);

  await tx.wait();
  console.log("Attestor updated successfully!");

  const currentAttestor = await questManager.attestor();
  console.log(`Current attestor: ${currentAttestor}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

