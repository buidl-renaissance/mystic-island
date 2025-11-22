import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("TotemManager", function () {
  let magicToken: any;
  let artifactCollection: any;
  let totemManager: any;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy MagicToken
    magicToken = await ethers.deployContract("MagicToken", [ownerAddress]);
    await magicToken.connect(owner).setMinter(ownerAddress, true);

    // Deploy ArtifactCollection
    artifactCollection = await ethers.deployContract("ArtifactCollection", [
      ownerAddress,
    ]);

    // Deploy TotemManager
    totemManager = await ethers.deployContract("TotemManager", [
      ownerAddress,
      await artifactCollection.getAddress(),
      await magicToken.getAddress(),
    ]);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await totemManager.owner()).to.equal(ownerAddress);
    });

    it("Should initialize with nextTotemId at 1", async function () {
      expect(await totemManager.nextTotemId()).to.equal(1n);
    });
  });

  describe("Creating Totems", function () {
    let artifactIds: bigint[];

    beforeEach(async function () {
      // Mint 3 artifacts to user1
      artifactIds = [];
      for (let i = 0; i < 3; i++) {
        const tx = await artifactCollection
          .connect(owner)
          .mintArtifact(user1Address, `https://example.com/artifact/${i}`);
        const receipt = await tx.wait();
        const event = receipt.logs.find(
          (log: any) =>
            log.topics[0] ===
            artifactCollection.interface.getEvent("ArtifactMinted").topicHash
        );
        const decoded = artifactCollection.interface.decodeEventLog(
          "ArtifactMinted",
          event.data,
          event.topics
        );
        artifactIds.push(decoded.tokenId);
      }
    });

    it("Should create a totem with artifacts", async function () {
      await expect(
        totemManager.connect(user1).createTotem(artifactIds)
      )
        .to.emit(totemManager, "TotemCreated")
        .withArgs(user1Address, 1n, artifactIds);

      const [id, creator, power, artifactCount] =
        await totemManager.getTotem(1n);
      expect(id).to.equal(1n);
      expect(creator).to.equal(user1Address);
      expect(power).to.equal(3n); // base power = number of artifacts
      expect(artifactCount).to.equal(3n);

      expect(await totemManager.nextTotemId()).to.equal(2n);
    });

    it("Should set artifactToTotem mapping", async function () {
      await totemManager.connect(user1).createTotem(artifactIds);

      for (const artifactId of artifactIds) {
        expect(await totemManager.artifactToTotem(artifactId)).to.equal(1n);
      }
    });

    it("Should return correct artifact IDs", async function () {
      await totemManager.connect(user1).createTotem(artifactIds);

      const returnedIds = await totemManager.getTotemArtifactIds(1n);
      expect(returnedIds.length).to.equal(3);
      expect(returnedIds[0]).to.equal(artifactIds[0]);
      expect(returnedIds[1]).to.equal(artifactIds[1]);
      expect(returnedIds[2]).to.equal(artifactIds[2]);
    });

    it("Should revert when creating totem with no artifacts", async function () {
      await expect(
        totemManager.connect(user1).createTotem([])
      ).to.be.revertedWith("Must provide at least one artifact");
    });

    it("Should revert when user doesn't own artifact", async function () {
      await expect(
        totemManager.connect(user2).createTotem(artifactIds)
      ).to.be.revertedWith("Not artifact owner");
    });

    it("Should revert when artifact is already in a totem", async function () {
      // Create first totem with all artifacts
      const tx = await totemManager.connect(user1).createTotem(artifactIds);
      await tx.wait(); // Wait for transaction to complete

      // Verify artifact is bound to totem
      expect(await totemManager.artifactToTotem(artifactIds[0])).to.equal(1n);

      // Try to create another totem with an artifact that's already in a totem
      await expect(
        totemManager.connect(user1).createTotem([artifactIds[0]])
      ).to.be.revertedWith("Artifact already in totem");
    });
  });

  describe("Adding Artifacts to Totem", function () {
    let totemId: bigint;
    let artifactIds: bigint[];

    beforeEach(async function () {
      // Create initial artifacts and totem
      artifactIds = [];
      for (let i = 0; i < 2; i++) {
        const tx = await artifactCollection
          .connect(owner)
          .mintArtifact(user1Address, `https://example.com/artifact/${i}`);
        const receipt = await tx.wait();
        const event = receipt.logs.find(
          (log: any) =>
            log.topics[0] ===
            artifactCollection.interface.getEvent("ArtifactMinted").topicHash
        );
        const decoded = artifactCollection.interface.decodeEventLog(
          "ArtifactMinted",
          event.data,
          event.topics
        );
        artifactIds.push(decoded.tokenId);
      }

      await totemManager.connect(user1).createTotem(artifactIds);
      totemId = 1n; // First totem has ID 1
    });

    it("Should add artifact to existing totem", async function () {
      // Mint a new artifact
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(user1Address, "https://example.com/artifact/new");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          artifactCollection.interface.getEvent("ArtifactMinted").topicHash
      );
      const decoded = artifactCollection.interface.decodeEventLog(
        "ArtifactMinted",
        event.data,
        event.topics
      );
      const newArtifactId = decoded.tokenId;

      await expect(
        totemManager.connect(user1).addArtifact(totemId, newArtifactId)
      )
        .to.emit(totemManager, "ArtifactAddedToTotem")
        .withArgs(user1Address, totemId, newArtifactId);

      const [, , power, artifactCount] = await totemManager.getTotem(totemId);
      expect(power).to.equal(3n); // 2 initial + 1 added
      expect(artifactCount).to.equal(3n);

      expect(await totemManager.artifactToTotem(newArtifactId)).to.equal(
        totemId
      );
    });

    it("Should increment power when adding artifact", async function () {
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(user1Address, "https://example.com/artifact/new");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          artifactCollection.interface.getEvent("ArtifactMinted").topicHash
      );
      const decoded = artifactCollection.interface.decodeEventLog(
        "ArtifactMinted",
        event.data,
        event.topics
      );
      const newArtifactId = decoded.tokenId;

      const [, , powerBefore] = await totemManager.getTotem(totemId);
      await totemManager.connect(user1).addArtifact(totemId, newArtifactId);
      const [, , powerAfter] = await totemManager.getTotem(totemId);

      expect(powerAfter).to.equal(powerBefore + 1n);
    });

    it("Should revert when adding artifact user doesn't own", async function () {
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(user2Address, "https://example.com/artifact/new");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          artifactCollection.interface.getEvent("ArtifactMinted").topicHash
      );
      const decoded = artifactCollection.interface.decodeEventLog(
        "ArtifactMinted",
        event.data,
        event.topics
      );
      const newArtifactId = decoded.tokenId;

      await expect(
        totemManager.connect(user1).addArtifact(totemId, newArtifactId)
      ).to.be.revertedWith("Not artifact owner");
    });

    it("Should revert when adding artifact already in a totem", async function () {
      // artifactIds[0] is already in the totem from beforeEach
      // Verify it's bound
      expect(await totemManager.artifactToTotem(artifactIds[0])).to.equal(totemId);

      // Try to add it again
      await expect(
        totemManager.connect(user1).addArtifact(totemId, artifactIds[0])
      ).to.be.revertedWith("Artifact already in totem");
    });
  });

  describe("Powering Up Totems", function () {
    let totemId: bigint;

    beforeEach(async function () {
      // Create artifact and totem
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(user1Address, "https://example.com/artifact/0");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          artifactCollection.interface.getEvent("ArtifactMinted").topicHash
      );
      const decoded = artifactCollection.interface.decodeEventLog(
        "ArtifactMinted",
        event.data,
        event.topics
      );
      const artifactId = decoded.tokenId;

      await totemManager.connect(user1).createTotem([artifactId]);
      totemId = 0n;

      // Mint Magic to user1
      await magicToken
        .connect(owner)
        .mint(user1Address, ethers.parseEther("1000"));
      await magicToken
        .connect(user1)
        .approve(await totemManager.getAddress(), ethers.parseEther("1000"));
    });

    it("Should power up totem with Magic", async function () {
      const magicAmount = ethers.parseEther("100");
      const [, , powerBefore] = await totemManager.getTotem(totemId);

      await expect(
        totemManager.connect(user1).powerUp(totemId, magicAmount)
      )
        .to.emit(totemManager, "TotemPoweredUp")
        .withArgs(user1Address, totemId, magicAmount, powerBefore + magicAmount);

      const [, , powerAfter] = await totemManager.getTotem(totemId);
      expect(powerAfter).to.equal(powerBefore + magicAmount);

      // Magic should be burned
      expect(await magicToken.balanceOf(await totemManager.getAddress())).to.equal(0n);
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        totemManager.connect(user1).powerUp(totemId, 0n)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert when totem doesn't exist", async function () {
      const magicAmount = ethers.parseEther("100");
      await expect(
        totemManager.connect(user1).powerUp(999n, magicAmount)
      ).to.be.revertedWith("Invalid totem ID");
    });

    it("Should revert when user hasn't approved Magic", async function () {
      const magicAmount = ethers.parseEther("100");
      await magicToken
        .connect(user1)
        .approve(await totemManager.getAddress(), 0n);

      await expect(
        totemManager.connect(user1).powerUp(totemId, magicAmount)
      ).to.be.revertedWithCustomError(magicToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Admin Functions", function () {
    let totemId: bigint;

    beforeEach(async function () {
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(user1Address, "https://example.com/artifact/0");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          artifactCollection.interface.getEvent("ArtifactMinted").topicHash
      );
      const decoded = artifactCollection.interface.decodeEventLog(
        "ArtifactMinted",
        event.data,
        event.topics
      );
      const artifactId = decoded.tokenId;

      await totemManager.connect(user1).createTotem([artifactId]);
      totemId = 0n;
    });

    it("Should allow owner to override power", async function () {
      const newPower = 999n;
      await expect(totemManager.connect(owner).adminSetPower(totemId, newPower))
        .to.emit(totemManager, "TotemPowerOverridden")
        .withArgs(totemId, newPower);

      const [, , power] = await totemManager.getTotem(totemId);
      expect(power).to.equal(newPower);
    });

    it("Should not allow non-owner to override power", async function () {
      await expect(
        totemManager.connect(user1).adminSetPower(totemId, 999n)
      ).to.be.revertedWithCustomError(
        totemManager,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});

