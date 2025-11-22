import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("ArtifactCollection", function () {
  let artifactCollection: any;
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();

    artifactCollection = await ethers.deployContract("ArtifactCollection", [
      ownerAddress,
    ]);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await artifactCollection.owner()).to.equal(ownerAddress);
    });

    it("Should have correct name and symbol", async function () {
      expect(await artifactCollection.name()).to.equal("Artifact");
      expect(await artifactCollection.symbol()).to.equal("ARTIFACT");
    });

    it("Should start with nextTokenId at 0", async function () {
      expect(await artifactCollection.nextTokenId()).to.equal(0n);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint artifact", async function () {
      const uri = "https://example.com/artifact/1";
      await expect(
        artifactCollection.connect(owner).mintArtifact(userAddress, uri)
      )
        .to.emit(artifactCollection, "ArtifactMinted")
        .withArgs(userAddress, 0n, uri);

      expect(await artifactCollection.ownerOf(0n)).to.equal(userAddress);
      expect(await artifactCollection.tokenURI(0n)).to.equal(uri);
      expect(await artifactCollection.nextTokenId()).to.equal(1n);
    });

    it("Should not allow non-owner to mint", async function () {
      const uri = "https://example.com/artifact/1";
      await expect(
        artifactCollection.connect(user).mintArtifact(userAddress, uri)
      ).to.be.revertedWithCustomError(
        artifactCollection,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should increment tokenId for each mint", async function () {
      const uri1 = "https://example.com/artifact/1";
      const uri2 = "https://example.com/artifact/2";
      const uri3 = "https://example.com/artifact/3";

      await artifactCollection.connect(owner).mintArtifact(userAddress, uri1);
      expect(await artifactCollection.nextTokenId()).to.equal(1n);

      await artifactCollection.connect(owner).mintArtifact(userAddress, uri2);
      expect(await artifactCollection.nextTokenId()).to.equal(2n);

      await artifactCollection.connect(owner).mintArtifact(userAddress, uri3);
      expect(await artifactCollection.nextTokenId()).to.equal(3n);

      expect(await artifactCollection.ownerOf(0n)).to.equal(userAddress);
      expect(await artifactCollection.ownerOf(1n)).to.equal(userAddress);
      expect(await artifactCollection.ownerOf(2n)).to.equal(userAddress);
    });

    it("Should return correct tokenId when minting", async function () {
      const uri = "https://example.com/artifact/1";
      const tx = await artifactCollection
        .connect(owner)
        .mintArtifact(userAddress, uri);
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
      expect(decoded.tokenId).to.equal(0n);
    });
  });

  describe("Token URI", function () {
    it("Should store and return correct URI", async function () {
      const uri = "https://example.com/artifact/custom-uri";
      await artifactCollection.connect(owner).mintArtifact(userAddress, uri);

      expect(await artifactCollection.tokenURI(0n)).to.equal(uri);
    });

    it("Should allow different URIs for different tokens", async function () {
      const uri1 = "https://example.com/artifact/1";
      const uri2 = "https://example.com/artifact/2";

      await artifactCollection.connect(owner).mintArtifact(userAddress, uri1);
      await artifactCollection.connect(owner).mintArtifact(userAddress, uri2);

      expect(await artifactCollection.tokenURI(0n)).to.equal(uri1);
      expect(await artifactCollection.tokenURI(1n)).to.equal(uri2);
    });
  });

  // Note: Burning functionality would require ERC721Burnable extension
  // For now, artifacts can be transferred but not burned directly
  // This test is skipped as the contract doesn't implement burn functionality
  describe.skip("Burning", function () {
    beforeEach(async function () {
      await artifactCollection
        .connect(owner)
        .mintArtifact(userAddress, "https://example.com/artifact/1");
    });

    it("Should allow owner to burn their artifact", async function () {
      // This would require ERC721Burnable extension
      await expect(artifactCollection.connect(user).burn(0n))
        .to.emit(artifactCollection, "Transfer")
        .withArgs(userAddress, ethers.ZeroAddress, 0n);

      await expect(artifactCollection.ownerOf(0n)).to.be.revertedWithCustomError(
        artifactCollection,
        "ERC721NonexistentToken"
      );
    });
  });
});

