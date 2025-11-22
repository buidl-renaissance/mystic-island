import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";
import { Wallet } from "ethers";

const { ethers } = await network.connect();

describe("QuestManager", function () {
  let magicToken: any;
  let questManager: any;
  let owner: Signer;
  let player: Signer;
  let attestor: Wallet;
  let ownerAddress: string;
  let playerAddress: string;
  let attestorAddress: string;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    playerAddress = await player.getAddress();

    // Create attestor wallet
    attestor = ethers.Wallet.createRandom();
    attestorAddress = attestor.address;

    // Deploy MagicToken
    magicToken = await ethers.deployContract("MagicToken", [ownerAddress]);
    await magicToken.connect(owner).setMinter(ownerAddress, true);

    // Deploy QuestManager
    questManager = await ethers.deployContract("QuestManager", [
      ownerAddress,
      await magicToken.getAddress(),
      attestorAddress,
    ]);

    // Set QuestManager as minter for MagicToken
    await magicToken.connect(owner).setMinter(await questManager.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await questManager.owner()).to.equal(ownerAddress);
    });

    it("Should set the right attestor", async function () {
      expect(await questManager.attestor()).to.equal(attestorAddress);
    });
  });

  describe("Attestor Management", function () {
    it("Should allow owner to update attestor", async function () {
      const newAttestor = ethers.Wallet.createRandom();
      await expect(
        questManager.connect(owner).setAttestor(newAttestor.address)
      )
        .to.emit(questManager, "AttestorUpdated")
        .withArgs(newAttestor.address);

      expect(await questManager.attestor()).to.equal(newAttestor.address);
    });

    it("Should not allow non-owner to update attestor", async function () {
      const newAttestor = ethers.Wallet.createRandom();
      await expect(
        questManager.connect(player).setAttestor(newAttestor.address)
      ).to.be.revertedWithCustomError(
        questManager,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Claiming Rewards", function () {
    const questId = 1n;
    const amount = ethers.parseEther("100");

    async function createSignature(
      player: string,
      questId: bigint,
      amount: bigint,
      contractAddress: string,
      chainId: bigint,
      signer: Wallet
    ): Promise<string> {
      // Create the message hash (matches contract's keccak256(abi.encodePacked(...)))
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address", "uint256"],
        [player, questId, amount, contractAddress, chainId]
      );

      // Convert to Ethereum signed message hash (matches contract's toEthSignedMessageHash())
      // toEthSignedMessageHash() does: keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
      const prefix = "\x19Ethereum Signed Message:\n32";
      const messageHashBytes = ethers.getBytes(messageHash);
      const prefixedMessage = ethers.concat([
        ethers.toUtf8Bytes(prefix),
        messageHashBytes
      ]);
      const ethSignedMessageHash = ethers.keccak256(prefixedMessage);

      // Sign the Ethereum signed message hash directly
      return signer.signingKey.sign(ethSignedMessageHash).serialized;
    }

    function createMessage(
      player: string,
      questId: bigint,
      amount: bigint,
      contractAddress: string,
      chainId: bigint
    ): string {
      return ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address", "uint256"],
        [player, questId, amount, contractAddress, chainId]
      );
    }

    it("Should allow player to claim reward with valid signature", async function () {
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const message = createMessage(
        playerAddress,
        questId,
        amount,
        contractAddress,
        chainId
      );
      const signature = await createSignature(
        playerAddress,
        questId,
        amount,
        contractAddress,
        chainId,
        attestor
      );

      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, questId, amount, signature)
      )
        .to.emit(questManager, "RewardClaimed")
        .withArgs(playerAddress, questId, amount, message);

      expect(await magicToken.balanceOf(playerAddress)).to.equal(amount);
      expect(await questManager.usedMessages(message)).to.be.true;
    });

    it("Should revert when amount is zero", async function () {
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const signature = await createSignature(
        playerAddress,
        questId,
        0n,
        contractAddress,
        chainId,
        attestor
      );

      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, questId, 0n, signature)
      ).to.be.revertedWith("Zero amount");
    });

    it("Should revert with invalid signature", async function () {
      const wrongAttestor = ethers.Wallet.createRandom();
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const signature = await createSignature(
        playerAddress,
        questId,
        amount,
        contractAddress,
        chainId,
        wrongAttestor
      );

      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, questId, amount, signature)
      ).to.be.revertedWith("Invalid attestor signature");
    });

    it("Should revert when reward already claimed", async function () {
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const message = createMessage(
        playerAddress,
        questId,
        amount,
        contractAddress,
        chainId
      );
      const signature = await createSignature(
        playerAddress,
        questId,
        amount,
        contractAddress,
        chainId,
        attestor
      );

      // Claim first time
      await questManager
        .connect(player)
        .claimReward(playerAddress, questId, amount, signature);

      // Try to claim again
      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, questId, amount, signature)
      ).to.be.revertedWith("Reward already claimed");
    });

    it("Should prevent replay attacks with different questId", async function () {
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // Claim for questId 1
      const message1 = createMessage(
        playerAddress,
        1n,
        amount,
        contractAddress,
        chainId
      );
      const signature1 = await createSignature(
        playerAddress,
        1n,
        amount,
        contractAddress,
        chainId,
        attestor
      );
      await questManager
        .connect(player)
        .claimReward(playerAddress, 1n, amount, signature1);

      // Try to claim for questId 2 with different signature
      const message2 = createMessage(
        playerAddress,
        2n,
        amount,
        contractAddress,
        chainId
      );
      const signature2 = await createSignature(
        playerAddress,
        2n,
        amount,
        contractAddress,
        chainId,
        attestor
      );
      
      // This should work because it's a different message
      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, 2n, amount, signature2)
      )
        .to.emit(questManager, "RewardClaimed")
        .withArgs(playerAddress, 2n, amount, message2);
    });

    it("Should prevent cross-chain replay attacks", async function () {
      const contractAddress = await questManager.getAddress();
      const currentChainId = (await ethers.provider.getNetwork()).chainId;
      const differentChainId = currentChainId === 1n ? 137n : 1n; // Use different chainId

      // Create signature for different chain
      const signature1 = await createSignature(
        playerAddress,
        questId,
        amount,
        contractAddress,
        differentChainId,
        attestor
      );

      // This should fail because the chainId in the message doesn't match
      // (The contract uses block.chainid, so it will create a different message)
      await expect(
        questManager
          .connect(player)
          .claimReward(playerAddress, questId, amount, signature1)
      ).to.be.revertedWith("Invalid attestor signature");
    });

    it("Should allow multiple different quest rewards", async function () {
      const contractAddress = await questManager.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // Claim multiple different quests
      for (let i = 1; i <= 3; i++) {
        const questAmount = ethers.parseEther((100 * i).toString());
        const signature = await createSignature(
          playerAddress,
          BigInt(i),
          questAmount,
          contractAddress,
          chainId,
          attestor
        );

        await questManager
          .connect(player)
          .claimReward(playerAddress, BigInt(i), questAmount, signature);
      }

      expect(await magicToken.balanceOf(playerAddress)).to.equal(
        ethers.parseEther("600") // 100 + 200 + 300
      );
    });
  });
});

