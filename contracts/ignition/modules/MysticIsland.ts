import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for Mystic Island contracts
 * 
 * Deployment order:
 * 1. MagicToken - ERC20 token (needed by TotemManager and QuestManager)
 * 2. ArtifactCollection - ERC721 NFTs (needed by TotemManager)
 * 3. TotemManager - Manages totems (needs MagicToken and ArtifactCollection)
 * 4. QuestManager - Handles quest rewards (needs MagicToken)
 * 
 * After deployment, you'll need to:
 * - Set QuestManager as a minter for MagicToken
 * - Set TotemManager as a minter for MagicToken (if needed)
 * - Set the attestor address for QuestManager
 */
export default buildModule("MysticIslandModule", (m) => {
  // Get the deployer address (will be msg.sender)
  const deployer = m.getAccount(0);

  // 1. Deploy MagicToken
  const magicToken = m.contract("MagicToken", [deployer]);

  // 2. Deploy ArtifactCollection
  const artifactCollection = m.contract("ArtifactCollection", [deployer]);

  // 3. Deploy TotemManager (needs MagicToken and ArtifactCollection addresses)
  const totemManager = m.contract("TotemManager", [
    deployer,
    artifactCollection,
    magicToken,
  ]);

  // 4. Deploy QuestManager (needs MagicToken address and attestor)
  // Note: You'll need to set the attestor address after deployment
  // For now, using deployer as placeholder - update this!
  const questManager = m.contract("QuestManager", [
    deployer,
    magicToken,
    deployer, // TODO: Replace with actual attestor address
  ]);

  // Set QuestManager as minter for MagicToken
  m.call(magicToken, "setMinter", [questManager, true]);

  // Optionally set TotemManager as minter if you want it to mint Magic
  // m.call(magicToken, "setMinter", [totemManager, true]);

  return {
    magicToken,
    artifactCollection,
    totemManager,
    questManager,
  };
});

