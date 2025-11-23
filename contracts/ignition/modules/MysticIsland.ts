import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for Mystic Island contracts
 * 
 * Deployment order:
 * 1. MagicToken - ERC20 token (needed by TotemManager and QuestManager)
 * 2. ArtifactCollection - ERC721 NFTs (needed by TotemManager and TribeManager)
 * 3. TribeManager - Manages tribes and initiation (needs ArtifactCollection)
 * 4. IslandMythos - Foundational contract for island theme/lore
 * 5. LocationRegistry - Manages locations (needs IslandMythos)
 * 6. LocationUnlock - Tracks location unlocks for players (needs LocationRegistry)
 * 7. Portal - Handles chainlet transitions (needs LocationRegistry and LocationUnlock)
 * 8. TotemManager - Manages totems (needs MagicToken and ArtifactCollection)
 * 9. QuestManager - Handles quest rewards (needs MagicToken)
 * 
 * After deployment, you'll need to:
 * - Set QuestManager as a minter for MagicToken (done automatically)
 * - Set TribeManager as a minter for ArtifactCollection (done automatically)
 * - Set the attestor address for QuestManager (optional, currently set to deployer)
 * - Initialize IslandMythos via the onboarding flow (/onboarding)
 * - Create locations via the create-location page (/create-location)
 */
export default buildModule("MysticIslandModule", (m) => {
  // Get the deployer address (will be msg.sender)
  const deployer = m.getAccount(0);

  // 1. Deploy MagicToken
  const magicToken = m.contract("MagicToken", [deployer]);

  // 2. Deploy ArtifactCollection
  const artifactCollection = m.contract("ArtifactCollection", [deployer]);

  // 3. Deploy TribeManager (needs ArtifactCollection address)
  const tribeManager = m.contract("TribeManager", [
    deployer,
    artifactCollection,
  ]);

  // Note: When creating tribes, you can set quorumThreshold:
  // - 0 = leader/owner only approval
  // - >0 = requires that many member approvals to reach quorum

  // 4. Deploy IslandMythos (foundational contract for island theme/lore)
  const islandMythos = m.contract("IslandMythos", [deployer]);

  // 5. Deploy LocationRegistry (needs IslandMythos address)
  const locationRegistry = m.contract("LocationRegistry", [
    deployer,
    islandMythos,
  ]);

  // 6. Deploy LocationUnlock (needs LocationRegistry address and admin)
  const locationUnlock = m.contract("LocationUnlock", [locationRegistry, deployer]);

  // 7. Deploy Portal (needs LocationRegistry and LocationUnlock addresses)
  const portal = m.contract("Portal", [locationRegistry, locationUnlock]);

  // 4. Deploy TotemManager (needs MagicToken and ArtifactCollection addresses)
  const totemManager = m.contract("TotemManager", [
    deployer,
    artifactCollection,
    magicToken,
  ]);

  // 5. Deploy QuestManager (needs MagicToken address and attestor)
  // Note: You'll need to set the attestor address after deployment
  // For now, using deployer as placeholder - update this!
  const questManager = m.contract("QuestManager", [
    deployer,
    magicToken,
    deployer, // TODO: Replace with actual attestor address
  ]);

  // Set QuestManager as minter for MagicToken
  m.call(magicToken, "setMinter", [questManager, true]);

  // Set TribeManager as minter for ArtifactCollection
  m.call(artifactCollection, "setMinter", [tribeManager, true]);

  // Optionally set TotemManager as minter if you want it to mint Magic
  // m.call(magicToken, "setMinter", [totemManager, true]);

  return {
    magicToken,
    artifactCollection,
    tribeManager,
    totemManager,
    questManager,
    islandMythos,
    locationRegistry,
    locationUnlock,
    portal,
  };
});

