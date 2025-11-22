import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("IslandMythos", function () {
  let islandMythos: any;
  let owner: Signer;
  let editor: Signer;
  let other: Signer;
  let ownerAddress: string;
  let editorAddress: string;
  let otherAddress: string;

  beforeEach(async function () {
    [owner, editor, other] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    editorAddress = await editor.getAddress();
    otherAddress = await other.getAddress();

    const IslandMythos = await ethers.getContractFactory("IslandMythos");
    islandMythos = await IslandMythos.deploy(ownerAddress);
    await islandMythos.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const DEFAULT_ADMIN_ROLE = await islandMythos.DEFAULT_ADMIN_ROLE();
      expect(await islandMythos.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should grant MYTHOS_EDITOR_ROLE to admin", async function () {
      const MYTHOS_EDITOR_ROLE = await islandMythos.MYTHOS_EDITOR_ROLE();
      expect(await islandMythos.hasRole(MYTHOS_EDITOR_ROLE, ownerAddress)).to.be.true;
    });

    it("Should not be initialized", async function () {
      expect(await islandMythos.isInitialized()).to.be.false;
    });
  });

  describe("Initialization", function () {
    it("Should allow editor to initialize mythos", async function () {
      const islandName = "Mystic Island";
      const shortTheme = "A collaborative myth-forging island";
      const artDirection = "magical realism, bioluminescent nature";
      const coreMyth = "An island where artifacts awaken dormant totems.";
      const loreURI = "ipfs://Qm...";

      await expect(
        islandMythos.connect(owner).initializeMythos(
          islandName,
          shortTheme,
          artDirection,
          coreMyth,
          loreURI
        )
      )
        .to.emit(islandMythos, "MythosInitialized")
        .withArgs(islandName, shortTheme, artDirection, coreMyth, loreURI, ownerAddress);

      expect(await islandMythos.isInitialized()).to.be.true;
      expect(await islandMythos.islandName()).to.equal(islandName);
      expect(await islandMythos.shortTheme()).to.equal(shortTheme);
    });

    it("Should not allow non-editor to initialize", async function () {
      const MYTHOS_EDITOR_ROLE = await islandMythos.MYTHOS_EDITOR_ROLE();
      await expect(
        islandMythos.connect(other).initializeMythos(
          "Test Island",
          "Theme",
          "Art",
          "Myth",
          "ipfs://..."
        )
      ).to.be.revertedWithCustomError(islandMythos, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow double initialization", async function () {
      await islandMythos.connect(owner).initializeMythos(
        "Island",
        "Theme",
        "Art",
        "Myth",
        "ipfs://..."
      );

      await expect(
        islandMythos.connect(owner).initializeMythos(
          "Island2",
          "Theme2",
          "Art2",
          "Myth2",
          "ipfs://..."
        )
      ).to.be.revertedWith("IslandMythos: already initialized");
    });
  });

  describe("Updates", function () {
    beforeEach(async function () {
      await islandMythos.connect(owner).initializeMythos(
        "Mystic Island",
        "A collaborative myth-forging island",
        "magical realism",
        "An island where artifacts awaken.",
        "ipfs://Qm..."
      );
    });

    it("Should allow editor to update mythos", async function () {
      await expect(
        islandMythos.connect(owner).updateMythos(
          "New Island Name",
          "New Theme",
          "New Art",
          "New Myth"
        )
      )
        .to.emit(islandMythos, "MythosUpdated")
        .withArgs("New Island Name", "New Theme", "New Art", "New Myth", ownerAddress);

      expect(await islandMythos.islandName()).to.equal("New Island Name");
    });

    it("Should allow partial updates", async function () {
      const originalName = await islandMythos.islandName();
      await islandMythos.connect(owner).updateMythos("", "New Theme", "", "");
      expect(await islandMythos.islandName()).to.equal(originalName);
      expect(await islandMythos.shortTheme()).to.equal("New Theme");
    });

    it("Should allow updating lore URI even after lock", async function () {
      await islandMythos.connect(owner).lockMythos();
      await expect(
        islandMythos.connect(owner).updateLoreURI("ipfs://QmNew")
      )
        .to.emit(islandMythos, "LoreURIUpdated")
        .withArgs("ipfs://QmNew", ownerAddress);
    });

    it("Should not allow updates after lock", async function () {
      await islandMythos.connect(owner).lockMythos();
      await expect(
        islandMythos.connect(owner).updateMythos("New Name", "", "", "")
      ).to.be.revertedWith("IslandMythos: mythos is locked");
    });
  });

  describe("Locking", function () {
    beforeEach(async function () {
      await islandMythos.connect(owner).initializeMythos(
        "Island",
        "Theme",
        "Art",
        "Myth",
        "ipfs://..."
      );
    });

    it("Should allow admin to lock mythos", async function () {
      await expect(islandMythos.connect(owner).lockMythos())
        .to.emit(islandMythos, "MythosLocked")
        .withArgs(ownerAddress);

      expect(await islandMythos.isLocked()).to.be.true;
    });

    it("Should not allow non-admin to lock", async function () {
      const MYTHOS_EDITOR_ROLE = await islandMythos.MYTHOS_EDITOR_ROLE();
      await islandMythos.grantRole(MYTHOS_EDITOR_ROLE, editorAddress);
      await expect(
        islandMythos.connect(editor).lockMythos()
      ).to.be.revertedWithCustomError(islandMythos, "AccessControlUnauthorizedAccount");
    });
  });
});

