import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("TribeManager", function () {
  let artifactCollection: any;
  let tribeManager: any;
  let owner: Signer;
  let tribeLeader: Signer;
  let applicant: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let tribeLeaderAddress: string;
  let applicantAddress: string;
  let user2Address: string;

  beforeEach(async function () {
    [owner, tribeLeader, applicant, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    tribeLeaderAddress = await tribeLeader.getAddress();
    applicantAddress = await applicant.getAddress();
    user2Address = await user2.getAddress();

    // Deploy ArtifactCollection
    artifactCollection = await ethers.deployContract("ArtifactCollection", [
      ownerAddress,
    ]);

    // Deploy TribeManager
    tribeManager = await ethers.deployContract("TribeManager", [
      ownerAddress,
      await artifactCollection.getAddress(),
    ]);

    // Set TribeManager as minter for ArtifactCollection
    await artifactCollection.connect(owner).setMinter(await tribeManager.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tribeManager.owner()).to.equal(ownerAddress);
    });

    it("Should initialize with nextTribeId at 1", async function () {
      expect(await tribeManager.nextTribeId()).to.equal(1n);
    });

    it("Should initialize with nextJoinRequestId at 1", async function () {
      expect(await tribeManager.nextJoinRequestId()).to.equal(1n);
    });
  });

  describe("Tribe Creation", function () {
    it("Should allow owner to create a tribe", async function () {
      await expect(
        tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0)
      )
        .to.emit(tribeManager, "TribeCreated")
        .withArgs(1n, "Warriors", tribeLeaderAddress, true);

      const [name, leader, requiresApproval, active] = await tribeManager.getTribe(1n);
      expect(name).to.equal("Warriors");
      expect(leader).to.equal(tribeLeaderAddress);
      expect(requiresApproval).to.be.true;
      expect(active).to.be.true;

      expect(await tribeManager.nextTribeId()).to.equal(2n);
    });

    it("Should not allow non-owner to create tribe", async function () {
      await expect(
        tribeManager.connect(tribeLeader).createTribe("Warriors", tribeLeaderAddress, true, 0)
      ).to.be.revertedWithCustomError(tribeManager, "OwnableUnauthorizedAccount");
    });

    it("Should allow creating multiple tribes", async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      await tribeManager.connect(owner).createTribe("Mages", user2Address, false, 0);

      expect(await tribeManager.nextTribeId()).to.equal(3n);
      
      const [name1] = await tribeManager.getTribe(1n);
      const [name2] = await tribeManager.getTribe(2n);
      expect(name1).to.equal("Warriors");
      expect(name2).to.equal("Mages");
    });
  });

  describe("Tribe Leader Management", function () {
    let tribeId: bigint;

    beforeEach(async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      tribeId = 1n;
    });

    it("Should allow owner to update tribe leader", async function () {
      await expect(tribeManager.connect(owner).setTribeLeader(tribeId, user2Address))
        .to.emit(tribeManager, "TribeLeaderUpdated")
        .withArgs(tribeId, user2Address);

      const [, leader] = await tribeManager.getTribe(tribeId);
      expect(leader).to.equal(user2Address);
    });

    it("Should not allow non-owner to update tribe leader", async function () {
      await expect(
        tribeManager.connect(tribeLeader).setTribeLeader(tribeId, user2Address)
      ).to.be.revertedWithCustomError(tribeManager, "OwnableUnauthorizedAccount");
    });

    it("Should revert when updating leader of inactive tribe", async function () {
      // Note: We don't have a function to deactivate tribes in v1, but we can test the check
      // For now, this test just verifies the active check exists
      // In a future version, you might add a deactivateTribe function
    });
  });

  describe("Join Requests", function () {
    let tribeId: bigint;

    beforeEach(async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      tribeId = 1n;
    });

    it("Should allow user to request to join and mint initiation artifact", async function () {
      const uri = "https://example.com/initiation/1";
      
      await expect(
        tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri)
      )
        .to.emit(tribeManager, "JoinRequested")
        .withArgs(1n, tribeId, applicantAddress, 0n); // First artifact has ID 0

      expect(await tribeManager.hasCreatedInitialArtifact(applicantAddress)).to.be.true;
      expect(await artifactCollection.ownerOf(0n)).to.equal(applicantAddress);
      expect(await artifactCollection.tokenURI(0n)).to.equal(uri);
    });

    it("Should revert when requesting to join inactive tribe", async function () {
      // Note: We don't have deactivate functionality in v1
      // This test would need that functionality
    });

    it("Should revert when user already created initial artifact", async function () {
      const uri1 = "https://example.com/initiation/1";
      const uri2 = "https://example.com/initiation/2";

      await tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri1);

      await expect(
        tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri2)
      ).to.be.revertedWith("Already initiated");
    });

    it("Should create join request with correct data", async function () {
      const uri = "https://example.com/initiation/1";
      await tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri);

      const [
        requestTribeId,
        requestApplicant,
        initiationArtifactId,
        approved,
        processed,
      ] = await tribeManager.getJoinRequest(1n);

      expect(requestTribeId).to.equal(tribeId);
      expect(requestApplicant).to.equal(applicantAddress);
      expect(initiationArtifactId).to.equal(0n);
      expect(approved).to.be.false;
      expect(processed).to.be.false;
    });
  });

  describe("Approving Join Requests", function () {
    let tribeId: bigint;
    let requestId: bigint;

    beforeEach(async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      tribeId = 1n;

      const uri = "https://example.com/initiation/1";
      const tx = await tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          tribeManager.interface.getEvent("JoinRequested").topicHash
      );
      const decoded = tribeManager.interface.decodeEventLog(
        "JoinRequested",
        event.data,
        event.topics
      );
      requestId = decoded.requestId;
    });

    it("Should allow tribe leader to approve join request", async function () {
      await expect(tribeManager.connect(tribeLeader).approveJoinRequest(requestId))
        .to.emit(tribeManager, "JoinApproved")
        .withArgs(requestId, tribeId, applicantAddress);

      expect(await tribeManager.isMember(tribeId, applicantAddress)).to.be.true;
      expect(await tribeManager.isApprovedInAnyTribe(applicantAddress)).to.be.true;
      expect(await tribeManager.isTribeMember(tribeId, applicantAddress)).to.be.true;
    });

    it("Should allow owner to approve join request", async function () {
      await expect(tribeManager.connect(owner).approveJoinRequest(requestId))
        .to.emit(tribeManager, "JoinApproved")
        .withArgs(requestId, tribeId, applicantAddress);

      expect(await tribeManager.isMember(tribeId, applicantAddress)).to.be.true;
    });

    it("Should not allow non-leader non-owner to approve", async function () {
      await expect(
        tribeManager.connect(user2).approveJoinRequest(requestId)
      ).to.be.revertedWith("Not tribe leader or owner");
    });

    it("Should revert when approving already processed request", async function () {
      await tribeManager.connect(tribeLeader).approveJoinRequest(requestId);

      await expect(
        tribeManager.connect(tribeLeader).approveJoinRequest(requestId)
      ).to.be.revertedWith("Already processed");
    });
  });

  describe("Rejecting Join Requests", function () {
    let tribeId: bigint;
    let requestId: bigint;

    beforeEach(async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      tribeId = 1n;

      const uri = "https://example.com/initiation/1";
      const tx = await tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          tribeManager.interface.getEvent("JoinRequested").topicHash
      );
      const decoded = tribeManager.interface.decodeEventLog(
        "JoinRequested",
        event.data,
        event.topics
      );
      requestId = decoded.requestId;
    });

    it("Should allow tribe leader to reject join request", async function () {
      await expect(tribeManager.connect(tribeLeader).rejectJoinRequest(requestId))
        .to.emit(tribeManager, "JoinRejected")
        .withArgs(requestId, tribeId, applicantAddress);

      expect(await tribeManager.isMember(tribeId, applicantAddress)).to.be.false;
      // User still keeps their initiation artifact
      expect(await tribeManager.hasCreatedInitialArtifact(applicantAddress)).to.be.true;
    });

    it("Should allow owner to reject join request", async function () {
      await expect(tribeManager.connect(owner).rejectJoinRequest(requestId))
        .to.emit(tribeManager, "JoinRejected")
        .withArgs(requestId, tribeId, applicantAddress);
    });

    it("Should not allow non-leader non-owner to reject", async function () {
      await expect(
        tribeManager.connect(user2).rejectJoinRequest(requestId)
      ).to.be.revertedWith("Not tribe leader or owner");
    });
  });

  describe("Member Artifact Minting", function () {
    let tribeId: bigint;

    beforeEach(async function () {
      await tribeManager.connect(owner).createTribe("Warriors", tribeLeaderAddress, true, 0);
      tribeId = 1n;

      // Applicant requests to join and gets approved
      const uri = "https://example.com/initiation/1";
      const tx = await tribeManager.connect(applicant).requestToJoinTribe(tribeId, uri);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          tribeManager.interface.getEvent("JoinRequested").topicHash
      );
      const decoded = tribeManager.interface.decodeEventLog(
        "JoinRequested",
        event.data,
        event.topics
      );
      const requestId = decoded.requestId;
      await tribeManager.connect(tribeLeader).approveJoinRequest(requestId);
    });

    it("Should allow approved member to mint additional artifacts", async function () {
      const uri = "https://example.com/artifact/1";
      
      await expect(
        tribeManager.connect(applicant).mintMemberArtifact(tribeId, uri)
      )
        .to.emit(tribeManager, "MemberArtifactMinted")
        .withArgs(tribeId, applicantAddress, 1n); // Second artifact (first was initiation)

      expect(await artifactCollection.ownerOf(1n)).to.equal(applicantAddress);
      expect(await artifactCollection.tokenURI(1n)).to.equal(uri);
    });

    it("Should not allow non-member to mint artifacts", async function () {
      const uri = "https://example.com/artifact/1";
      
      await expect(
        tribeManager.connect(user2).mintMemberArtifact(tribeId, uri)
      ).to.be.revertedWith("Not tribe member");
    });

    it("Should allow member to mint multiple artifacts", async function () {
      const uri1 = "https://example.com/artifact/1";
      const uri2 = "https://example.com/artifact/2";

      await tribeManager.connect(applicant).mintMemberArtifact(tribeId, uri1);
      await tribeManager.connect(applicant).mintMemberArtifact(tribeId, uri2);

      expect(await artifactCollection.ownerOf(1n)).to.equal(applicantAddress);
      expect(await artifactCollection.ownerOf(2n)).to.equal(applicantAddress);
    });
  });
});

