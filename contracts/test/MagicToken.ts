import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("MagicToken", function () {
  let magicToken: any;
  let owner: Signer;
  let minter: Signer;
  let user: Signer;
  let ownerAddress: string;
  let minterAddress: string;
  let userAddress: string;

  beforeEach(async function () {
    [owner, minter, user] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    minterAddress = await minter.getAddress();
    userAddress = await user.getAddress();

    magicToken = await ethers.deployContract("MagicToken", [ownerAddress]);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await magicToken.owner()).to.equal(ownerAddress);
    });

    it("Should have correct name and symbol", async function () {
      expect(await magicToken.name()).to.equal("Magic");
      expect(await magicToken.symbol()).to.equal("MAGIC");
    });

    it("Should have zero initial supply", async function () {
      expect(await magicToken.totalSupply()).to.equal(0n);
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to set minter", async function () {
      await expect(magicToken.connect(owner).setMinter(minterAddress, true))
        .to.emit(magicToken, "MinterUpdated")
        .withArgs(minterAddress, true);

      expect(await magicToken.isMinter(minterAddress)).to.be.true;
    });

    it("Should allow owner to revoke minter", async function () {
      await magicToken.connect(owner).setMinter(minterAddress, true);
      await magicToken.connect(owner).setMinter(minterAddress, false);

      expect(await magicToken.isMinter(minterAddress)).to.be.false;
    });

    it("Should not allow non-owner to set minter", async function () {
      await expect(
        magicToken.connect(minter).setMinter(minterAddress, true)
      ).to.be.revertedWithCustomError(magicToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await magicToken.connect(owner).setMinter(minterAddress, true);
    });

    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await expect(magicToken.connect(minter).mint(userAddress, amount))
        .to.emit(magicToken, "Transfer")
        .withArgs(ethers.ZeroAddress, userAddress, amount);

      expect(await magicToken.balanceOf(userAddress)).to.equal(amount);
      expect(await magicToken.totalSupply()).to.equal(amount);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        magicToken.connect(user).mint(userAddress, amount)
      ).to.be.revertedWith("MagicToken: not minter");
    });

    it("Should allow multiple mints", async function () {
      const amount1 = ethers.parseEther("50");
      const amount2 = ethers.parseEther("75");

      await magicToken.connect(minter).mint(userAddress, amount1);
      await magicToken.connect(minter).mint(userAddress, amount2);

      expect(await magicToken.balanceOf(userAddress)).to.equal(
        amount1 + amount2
      );
      expect(await magicToken.totalSupply()).to.equal(amount1 + amount2);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await magicToken.connect(owner).setMinter(minterAddress, true);
      await magicToken.connect(minter).mint(userAddress, ethers.parseEther("100"));
    });

    it("Should allow user to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("30");
      await expect(magicToken.connect(user).burn(burnAmount))
        .to.emit(magicToken, "Transfer")
        .withArgs(userAddress, ethers.ZeroAddress, burnAmount);

      expect(await magicToken.balanceOf(userAddress)).to.equal(
        ethers.parseEther("70")
      );
      expect(await magicToken.totalSupply()).to.equal(ethers.parseEther("70"));
    });

    it("Should allow user to burn from another account with allowance", async function () {
      const burnAmount = ethers.parseEther("25");
      await magicToken.connect(user).approve(minterAddress, burnAmount);

      await expect(magicToken.connect(minter).burnFrom(userAddress, burnAmount))
        .to.emit(magicToken, "Transfer")
        .withArgs(userAddress, ethers.ZeroAddress, burnAmount);

      expect(await magicToken.balanceOf(userAddress)).to.equal(
        ethers.parseEther("75")
      );
    });

    it("Should revert when burning more than balance", async function () {
      const burnAmount = ethers.parseEther("150");
      await expect(
        magicToken.connect(user).burn(burnAmount)
      ).to.be.revertedWithCustomError(magicToken, "ERC20InsufficientBalance");
    });
  });
});

