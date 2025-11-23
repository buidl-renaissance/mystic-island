import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script to extract deployed contract addresses from Hardhat Ignition deployment
 * and update src/utils/contracts.ts and DEPLOYED_CONTRACTS.md
 * 
 * Usage:
 * After deployment, run:
 * npx hardhat run scripts/update-addresses.ts
 * 
 * Or provide the deployment ID:
 * DEPLOYMENT_ID=<id> npx hardhat run scripts/update-addresses.ts
 */

interface DeploymentAddresses {
  [key: string]: string;
}

async function main() {
  const deploymentId = process.env.DEPLOYMENT_ID || "default";
  const networkId = "2763823383026000"; // Saga chainlet chain ID
  
  // Path to deployed addresses file
  const addressesPath = join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    `chain-${networkId}`,
    "deployed_addresses.json"
  );

  console.log("📋 Reading deployed addresses from:", addressesPath);

  try {
    const addressesJson = readFileSync(addressesPath, "utf-8");
    const addresses: DeploymentAddresses = JSON.parse(addressesJson);

    console.log("\n✅ Found deployed contracts:");
    console.log("=".repeat(60));

    // Map Ignition module names to our contract names
    const contractMap: { [key: string]: string } = {
      "MysticIslandModule#MagicToken": "MAGIC_TOKEN",
      "MysticIslandModule#ArtifactCollection": "ARTIFACT_COLLECTION",
      "MysticIslandModule#TribeManager": "TRIBE_MANAGER",
      "MysticIslandModule#IslandMythos": "ISLAND_MYTHOS",
      "MysticIslandModule#LocationRegistry": "LOCATION_REGISTRY",
      "MysticIslandModule#TotemManager": "TOTEM_MANAGER",
      "MysticIslandModule#QuestManager": "QUEST_MANAGER",
    };

    const contractAddresses: { [key: string]: string } = {};

    for (const [ignitionKey, address] of Object.entries(addresses)) {
      const contractName = contractMap[ignitionKey];
      if (contractName) {
        contractAddresses[contractName] = address;
        console.log(`${contractName}: ${address}`);
      } else {
        console.log(`${ignitionKey}: ${address} (not mapped)`);
      }
    }

    console.log("=".repeat(60));

    // Update src/utils/contracts.ts
    const contractsTsPath = join(__dirname, "..", "..", "src", "utils", "contracts.ts");
    console.log("\n📝 Updating src/utils/contracts.ts...");

    let contractsTs = readFileSync(contractsTsPath, "utf-8");

    // Update each contract address
    for (const [contractName, address] of Object.entries(contractAddresses)) {
      const regex = new RegExp(
        `(${contractName}:\\s*")([^"]+)(")`,
        "g"
      );
      contractsTs = contractsTs.replace(regex, `$1${address}$3`);
      console.log(`  ✓ Updated ${contractName}`);
    }

    writeFileSync(contractsTsPath, contractsTs, "utf-8");
    console.log("✅ Updated src/utils/contracts.ts");

    // Update DEPLOYED_CONTRACTS.md
    const deployedMdPath = join(__dirname, "..", "DEPLOYED_CONTRACTS.md");
    console.log("\n📝 Updating DEPLOYED_CONTRACTS.md...");

    let deployedMd = readFileSync(deployedMdPath, "utf-8");

    // Update deployment date
    const now = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    deployedMd = deployedMd.replace(
      /\*\*Deployment Date:\*\*.*/,
      `**Deployment Date:** ${now}`
    );

    // Update deployer (we'll get it from the first contract or keep existing)
    // For now, we'll leave it as TBD or update manually

    // Update contract addresses
    const addressUpdates: { [key: string]: { name: string; description: string } } = {
      MAGIC_TOKEN: { name: "MagicToken (ERC20)", description: "- **Name:** Magic\n- **Symbol:** MAGIC\n- **Purpose:** Fungible token for powering up totems and quest rewards" },
      ARTIFACT_COLLECTION: { name: "ArtifactCollection (ERC721)", description: "- **Name:** Artifact\n- **Symbol:** ARTIFACT\n- **Purpose:** NFT collection for unique artifacts that can be combined into totems" },
      TRIBE_MANAGER: { name: "TribeManager", description: "- **Purpose:** Manages tribes, initiation artifacts, and member artifact minting\n- **Dependencies:** ArtifactCollection" },
      ISLAND_MYTHOS: { name: "IslandMythos", description: "- **Purpose:** Canonical source of truth for the island's mythos, theme, and lore\n- **Status:** Must be initialized before locations can be created" },
      LOCATION_REGISTRY: { name: "LocationRegistry", description: "- **Purpose:** Registry of named locations on the island\n- **Dependencies:** IslandMythos" },
      TOTEM_MANAGER: { name: "TotemManager", description: "- **Purpose:** Manages totem creation, artifact binding, and power-ups\n- **Dependencies:** MagicToken, ArtifactCollection" },
      QUEST_MANAGER: { name: "QuestManager", description: "- **Purpose:** Handles quest reward claims with signature verification\n- **Dependencies:** MagicToken\n- **Status:** Will be set as minter for MagicToken after deployment\n- **Attestor:** TBD (can be updated after deployment)" },
    };

    for (const [contractName, address] of Object.entries(contractAddresses)) {
      const info = addressUpdates[contractName];
      if (info) {
        // Update the address in the markdown
        const regex = new RegExp(
          `(### ${info.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n\\s*\`\`\`\\s*\\n)([^\\n]+)(\\n\\s*\`\`\`)`,
          "s"
        );
        if (regex.test(deployedMd)) {
          deployedMd = deployedMd.replace(regex, `$1${address}$3`);
        } else {
          // If pattern doesn't exist, try simpler pattern
          const simpleRegex = new RegExp(
            `(${info.name}[^\\n]*\\n\\s*\`\`\`\\s*\\n)([^\\n]+)(\\n\\s*\`\`\`)`,
            "s"
          );
          deployedMd = deployedMd.replace(simpleRegex, `$1${address}$3`);
        }
        console.log(`  ✓ Updated ${info.name}`);
      }
    }

    // Update deployment status checkboxes
    for (const contractName of Object.keys(contractAddresses)) {
      const statusMap: { [key: string]: string } = {
        MAGIC_TOKEN: "MagicToken deployed",
        ARTIFACT_COLLECTION: "ArtifactCollection deployed",
        TRIBE_MANAGER: "TribeManager deployed",
        ISLAND_MYTHOS: "IslandMythos deployed",
        LOCATION_REGISTRY: "LocationRegistry deployed",
        TOTEM_MANAGER: "TotemManager deployed",
        QUEST_MANAGER: "QuestManager deployed",
      };
      const statusText = statusMap[contractName];
      if (statusText) {
        deployedMd = deployedMd.replace(
          new RegExp(`(- \\[ \\]) ${statusText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"),
          `(- [x]) ${statusText}`
        );
      }
    }

    writeFileSync(deployedMdPath, deployedMd, "utf-8");
    console.log("✅ Updated DEPLOYED_CONTRACTS.md");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Address update complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Summary:");
    console.log(`  - Updated ${Object.keys(contractAddresses).length} contract addresses`);
    console.log("  - Updated src/utils/contracts.ts");
    console.log("  - Updated DEPLOYED_CONTRACTS.md");
    console.log("\n✨ Next steps:");
    console.log("  1. Review the updated addresses");
    console.log("  2. Initialize IslandMythos via /onboarding");
    console.log("  3. Create locations via /create-location");

  } catch (error) {
    console.error("❌ Error updating addresses:", error);
    if (error instanceof Error && error.message.includes("ENOENT")) {
      console.error("\n💡 Make sure you've deployed contracts first!");
      console.error("   Run: npx hardhat ignition deploy MysticIsland --network saga");
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

