import { expect } from "chai";
import { network } from "hardhat";
import type { Signer } from "ethers";

const { ethers } = await network.connect();

describe("LocationRegistry", function () {
  let locationRegistry: any;
  let islandMythos: any;
  let owner: Signer;
  let editor: Signer;
  let other: Signer;
  let ownerAddress: string;
  let editorAddress: string;

  beforeEach(async function () {
    [owner, editor, other] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    editorAddress = await editor.getAddress();

    // Deploy IslandMythos first
    const IslandMythos = await ethers.getContractFactory("IslandMythos");
    islandMythos = await IslandMythos.deploy(ownerAddress);
    await islandMythos.waitForDeployment();

    // Initialize mythos
    await islandMythos.connect(owner).initializeMythos(
      "Mystic Island",
      "A collaborative myth-forging island",
      "magical realism",
      "An island where artifacts awaken.",
      "ipfs://Qm..."
    );

    // Deploy LocationRegistry
    const LocationRegistry = await ethers.getContractFactory("LocationRegistry");
    locationRegistry = await LocationRegistry.deploy(
      ownerAddress,
      await islandMythos.getAddress()
    );
    await locationRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const DEFAULT_ADMIN_ROLE = await locationRegistry.DEFAULT_ADMIN_ROLE();
      expect(await locationRegistry.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should set mythos contract", async function () {
      expect(await locationRegistry.mythosContract()).to.equal(await islandMythos.getAddress());
    });

    it("Should start with 0 total locations", async function () {
      expect(await locationRegistry.totalLocations()).to.equal(0n);
    });
  });

  describe("Creating Locations", function () {
    it("Should allow editor to create location", async function () {
      await expect(
        locationRegistry.connect(owner).createLocation(
          "fountain-path",
          "Fountain Path Sanctuary",
          "Overgrown stone statue guarding a path",
          2, // Forest
          1, // Easy
          0, // No parent
          "ipfs://QmScene",
          ethers.ZeroAddress,
          "ipfs://QmMeta"
        )
      )
        .to.emit(locationRegistry, "LocationCreated")
        .withArgs(1n, "fountain-path", "Fountain Path Sanctuary", 2, 0n, ethers.ZeroAddress, ownerAddress);

      expect(await locationRegistry.totalLocations()).to.equal(1n);
    });

    it("Should not allow creating location before mythos is initialized", async function () {
      // Deploy new mythos without initializing
      const IslandMythos = await ethers.getContractFactory("IslandMythos");
      const newMythos = await IslandMythos.deploy(ownerAddress);
      await newMythos.waitForDeployment();

      const LocationRegistry = await ethers.getContractFactory("LocationRegistry");
      const newRegistry = await LocationRegistry.deploy(ownerAddress, await newMythos.getAddress());
      await newRegistry.waitForDeployment();

      await expect(
        newRegistry.connect(owner).createLocation(
          "test",
          "Test",
          "Description",
          1,
          1,
          0,
          "",
          ethers.ZeroAddress,
          ""
        )
      ).to.be.revertedWith("LocationRegistry: mythos not initialized");
    });

    it("Should not allow duplicate slugs", async function () {
      await locationRegistry.connect(owner).createLocation(
        "fountain-path",
        "Fountain Path",
        "Description",
        1,
        1,
        0,
        "",
        ethers.ZeroAddress,
        ""
      );

      await expect(
        locationRegistry.connect(owner).createLocation(
          "fountain-path",
          "Another",
          "Description",
          1,
          1,
          0,
          "",
          ethers.ZeroAddress,
          ""
        )
      ).to.be.revertedWith("LocationRegistry: slug already exists");
    });

    it("Should allow creating child locations", async function () {
      await locationRegistry.connect(owner).createLocation(
        "parent",
        "Parent Location",
        "Parent",
        1,
        1,
        0,
        "",
        ethers.ZeroAddress,
        ""
      );

      await expect(
        locationRegistry.connect(owner).createLocation(
          "child",
          "Child Location",
          "Child",
          1,
          1,
          1, // Parent ID
          "",
          ethers.ZeroAddress,
          ""
        )
      ).to.emit(locationRegistry, "LocationCreated");

      const children = await locationRegistry.listChildren(1);
      expect(children.length).to.equal(1);
      expect(children[0].slug).to.equal("child");
    });

    it("Should not allow invalid parent location", async function () {
      await expect(
        locationRegistry.connect(owner).createLocation(
          "child",
          "Child",
          "Description",
          1,
          1,
          999, // Non-existent parent
          "",
          ethers.ZeroAddress,
          ""
        )
      ).to.be.revertedWith("LocationRegistry: parent location does not exist");
    });
  });

  describe("Updating Locations", function () {
    let locationId: bigint;

    beforeEach(async function () {
      const tx = await locationRegistry.connect(owner).createLocation(
        "fountain-path",
        "Fountain Path",
        "Description",
        2, // Forest
        1, // Easy
        0,
        "ipfs://scene",
        ethers.ZeroAddress,
        "ipfs://meta"
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === locationRegistry.interface.getEvent("LocationCreated").topicHash
      );
      const decoded = locationRegistry.interface.decodeEventLog("LocationCreated", event?.data || "", event?.topics || []);
      locationId = decoded.id;
    });

    it("Should allow updating location metadata", async function () {
      await expect(
        locationRegistry.connect(owner).updateLocationMetadata(
          locationId,
          "New Name",
          "New Description",
          3, // Marsh
          2, // Normal
          0,
          "ipfs://new-scene",
          "ipfs://new-meta"
        )
      )
        .to.emit(locationRegistry, "LocationUpdated")
        .withArgs(locationId, "New Name", 3, 2, 0n, ownerAddress);

      const location = await locationRegistry.getLocation(locationId);
      expect(location.displayName).to.equal("New Name");
      expect(location.biome).to.equal(3);
    });

    it("Should allow partial updates", async function () {
      const originalName = (await locationRegistry.getLocation(locationId)).displayName;
      await locationRegistry.connect(owner).updateLocationMetadata(
        locationId,
        "", // Keep name
        "New Description",
        0, // Keep biome
        0, // Keep difficulty
        0,
        "",
        ""
      );

      const location = await locationRegistry.getLocation(locationId);
      expect(location.displayName).to.equal(originalName);
      expect(location.description).to.equal("New Description");
    });

    it("Should allow updating slug", async function () {
      await expect(
        locationRegistry.connect(owner).updateLocationSlug(locationId, "new-slug")
      )
        .to.emit(locationRegistry, "LocationSlugUpdated")
        .withArgs(locationId, "fountain-path", "new-slug", ownerAddress);

      expect(await locationRegistry.getLocationIdBySlug("new-slug")).to.equal(locationId);
      expect(await locationRegistry.getLocationIdBySlug("fountain-path")).to.equal(0n);
    });

    it("Should allow setting controller", async function () {
      const controllerAddress = await editor.getAddress();
      await expect(
        locationRegistry.connect(owner).setLocationController(locationId, controllerAddress)
      )
        .to.emit(locationRegistry, "LocationControllerUpdated")
        .withArgs(locationId, controllerAddress, ownerAddress);

      const location = await locationRegistry.getLocation(locationId);
      expect(location.controller).to.equal(controllerAddress);
    });

    it("Should allow activating/deactivating", async function () {
      await expect(
        locationRegistry.connect(owner).setLocationActive(locationId, false)
      )
        .to.emit(locationRegistry, "LocationDeactivated")
        .withArgs(locationId, ownerAddress);

      let location = await locationRegistry.getLocation(locationId);
      expect(location.isActive).to.be.false;

      await expect(
        locationRegistry.connect(owner).setLocationActive(locationId, true)
      )
        .to.emit(locationRegistry, "LocationActivated")
        .withArgs(locationId, ownerAddress);

      location = await locationRegistry.getLocation(locationId);
      expect(location.isActive).to.be.true;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await locationRegistry.connect(owner).createLocation(
        "location-1",
        "Location 1",
        "Description 1",
        1,
        1,
        0,
        "",
        ethers.ZeroAddress,
        ""
      );
      await locationRegistry.connect(owner).createLocation(
        "location-2",
        "Location 2",
        "Description 2",
        2,
        2,
        1, // Parent
        "",
        ethers.ZeroAddress,
        ""
      );
    });

    it("Should get location by ID", async function () {
      const location = await locationRegistry.getLocation(1);
      expect(location.slug).to.equal("location-1");
      expect(location.displayName).to.equal("Location 1");
    });

    it("Should get location by slug", async function () {
      const location = await locationRegistry.getLocationBySlug("location-2");
      expect(location.id).to.equal(2n);
    });

    it("Should list locations with pagination", async function () {
      const locations = await locationRegistry.listLocations(0, 10);
      expect(locations.length).to.equal(2);
    });

    it("Should list children", async function () {
      const children = await locationRegistry.listChildren(1);
      expect(children.length).to.equal(1);
      expect(children[0].slug).to.equal("location-2");
    });
  });
});

