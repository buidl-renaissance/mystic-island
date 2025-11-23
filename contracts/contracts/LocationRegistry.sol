// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Mythos.sol";

/**
 * @title LocationRegistry
 * @dev Registry of named locations on the island
 */
contract LocationRegistry is AccessControl {
    bytes32 public constant LOCATION_EDITOR_ROLE = keccak256("LOCATION_EDITOR_ROLE");

    enum BiomeType {
        Unknown,
        Meadow,
        Forest,
        Marsh,
        Mountain,
        Beach,
        Ruins,
        Bazaar,
        Shrine,
        Cave,
        Custom
    }

    enum DifficultyTier {
        None,
        Easy,
        Normal,
        Hard,
        Mythic
    }

    struct Location {
        uint256 id;               // unique incremental ID
        string slug;              // short, URL-safe identifier, e.g. "fountain-path"
        string displayName;       // "Fountain Path Sanctuary"
        string description;       // human-facing description
        BiomeType biome;          // main biome type
        DifficultyTier difficulty; // rough difficulty / advancement gating
        uint256 parentLocationId; // 0 if root / no parent
        bool isActive;            // soft-delete flag
        string sceneURI;          // IPFS / URL to scene config (Unity / JSON)
        address controller;       // optional contract that handles logic
        string metadataURI;       // optional extra config (e.g. AI narrative config)
    }

    uint256 private _nextLocationId = 1;
    mapping(uint256 => Location) private _locations;
    mapping(string => uint256) private _slugToId;
    Mythos public mythosContract;

    event LocationCreated(
        uint256 indexed id,
        string slug,
        string displayName,
        BiomeType biome,
        uint256 parentLocationId,
        address controller,
        address indexed editor
    );

    event LocationUpdated(
        uint256 indexed id,
        string displayName,
        BiomeType biome,
        DifficultyTier difficulty,
        uint256 parentLocationId,
        address indexed editor
    );

    event LocationSlugUpdated(
        uint256 indexed id,
        string oldSlug,
        string newSlug,
        address indexed editor
    );

    event LocationControllerUpdated(
        uint256 indexed id,
        address newController,
        address indexed editor
    );

    event LocationActivated(uint256 indexed id, address indexed editor);
    event LocationDeactivated(uint256 indexed id, address indexed editor);

    /**
     * @dev Constructor sets the admin role and mythos contract
     * @param admin_ The address that will have DEFAULT_ADMIN_ROLE
     * @param mythosContract_ The address of the IslandMythos contract
     */
    constructor(address admin_, address mythosContract_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(LOCATION_EDITOR_ROLE, admin_);
        mythosContract = Mythos(mythosContract_);
    }

    /**
     * @dev Create a new location
     * @param slug URL-safe identifier
     * @param displayName Human-readable name
     * @param description Description of the location
     * @param biome Biome type
     * @param difficulty Difficulty tier
     * @param parentLocationId Parent location ID (0 for root)
     * @param sceneURI URI to scene config
     * @param controller Optional controller contract address
     * @param metadataURI Optional metadata URI
     * @return The ID of the newly created location
     */
    function createLocation(
        string calldata slug,
        string calldata displayName,
        string calldata description,
        BiomeType biome,
        DifficultyTier difficulty,
        uint256 parentLocationId,
        string calldata sceneURI,
        address controller,
        string calldata metadataURI
    ) external onlyRole(LOCATION_EDITOR_ROLE) returns (uint256) {
        require(mythosContract.isInitialized(), "LocationRegistry: mythos not initialized");
        require(bytes(slug).length > 0, "LocationRegistry: slug cannot be empty");
        require(_slugToId[slug] == 0, "LocationRegistry: slug already exists");

        if (parentLocationId != 0) {
            require(_locations[parentLocationId].id != 0, "LocationRegistry: parent location does not exist");
        }

        uint256 locationId = _nextLocationId;
        _nextLocationId += 1;

        _locations[locationId] = Location({
            id: locationId,
            slug: slug,
            displayName: displayName,
            description: description,
            biome: biome,
            difficulty: difficulty,
            parentLocationId: parentLocationId,
            isActive: true,
            sceneURI: sceneURI,
            controller: controller,
            metadataURI: metadataURI
        });

        _slugToId[slug] = locationId;

        emit LocationCreated(locationId, slug, displayName, biome, parentLocationId, controller, msg.sender);

        return locationId;
    }

    /**
     * @dev Update location metadata
     * @param id Location ID
     * @param displayName New display name (empty string to keep current)
     * @param description New description (empty string to keep current)
     * @param biome New biome (will use current if invalid enum)
     * @param difficulty New difficulty (will use current if invalid enum)
     * @param parentLocationId New parent location ID (0 to remove parent, must exist if non-zero)
     * @param sceneURI New scene URI (empty string to keep current)
     * @param metadataURI New metadata URI (empty string to keep current)
     */
    function updateLocationMetadata(
        uint256 id,
        string calldata displayName,
        string calldata description,
        BiomeType biome,
        DifficultyTier difficulty,
        uint256 parentLocationId,
        string calldata sceneURI,
        string calldata metadataURI
    ) external onlyRole(LOCATION_EDITOR_ROLE) {
        require(_locations[id].id != 0, "LocationRegistry: location does not exist");

        Location storage location = _locations[id];

        if (bytes(displayName).length > 0) {
            location.displayName = displayName;
        }
        if (bytes(description).length > 0) {
            location.description = description;
        }
        // Update biome if valid (within enum range)
        if (uint8(biome) <= uint8(BiomeType.Custom)) {
            location.biome = biome;
        }
        // Update difficulty if valid (within enum range)
        if (uint8(difficulty) <= uint8(DifficultyTier.Mythic)) {
            location.difficulty = difficulty;
        }
        if (parentLocationId != 0) {
            require(_locations[parentLocationId].id != 0, "LocationRegistry: new parent location does not exist");
        }
        location.parentLocationId = parentLocationId;
        if (bytes(sceneURI).length > 0) {
            location.sceneURI = sceneURI;
        }
        if (bytes(metadataURI).length > 0) {
            location.metadataURI = metadataURI;
        }

        emit LocationUpdated(id, location.displayName, location.biome, location.difficulty, location.parentLocationId, msg.sender);
    }

    /**
     * @dev Update location slug
     * @param id Location ID
     * @param newSlug New slug
     */
    function updateLocationSlug(uint256 id, string calldata newSlug) external onlyRole(LOCATION_EDITOR_ROLE) {
        require(_locations[id].id != 0, "LocationRegistry: location does not exist");
        require(bytes(newSlug).length > 0, "LocationRegistry: slug cannot be empty");
        require(_slugToId[newSlug] == 0, "LocationRegistry: new slug already exists");

        Location storage location = _locations[id];
        string memory oldSlug = location.slug;

        delete _slugToId[oldSlug];
        _slugToId[newSlug] = id;
        location.slug = newSlug;

        emit LocationSlugUpdated(id, oldSlug, newSlug, msg.sender);
    }

    /**
     * @dev Set location controller contract
     * @param id Location ID
     * @param newController New controller contract address
     */
    function setLocationController(uint256 id, address newController) external onlyRole(LOCATION_EDITOR_ROLE) {
        require(_locations[id].id != 0, "LocationRegistry: location does not exist");

        _locations[id].controller = newController;

        emit LocationControllerUpdated(id, newController, msg.sender);
    }

    /**
     * @dev Set location active status
     * @param id Location ID
     * @param active Active status
     */
    function setLocationActive(uint256 id, bool active) external onlyRole(LOCATION_EDITOR_ROLE) {
        require(_locations[id].id != 0, "LocationRegistry: location does not exist");

        _locations[id].isActive = active;

        if (active) {
            emit LocationActivated(id, msg.sender);
        } else {
            emit LocationDeactivated(id, msg.sender);
        }
    }

    /**
     * @dev Get location by ID
     * @param id Location ID
     * @return The location struct
     */
    function getLocation(uint256 id) external view returns (Location memory) {
        require(_locations[id].id != 0, "LocationRegistry: location does not exist");
        return _locations[id];
    }

    /**
     * @dev Get location by slug
     * @param slug Location slug
     * @return The location struct
     */
    function getLocationBySlug(string calldata slug) external view returns (Location memory) {
        uint256 id = _slugToId[slug];
        require(id != 0, "LocationRegistry: location not found");
        return _locations[id];
    }

    /**
     * @dev Check if location exists
     * @param id Location ID
     * @return True if location exists
     */
    function locationExists(uint256 id) external view returns (bool) {
        return _locations[id].id != 0;
    }

    /**
     * @dev Get location ID by slug
     * @param slug Location slug
     * @return The location ID (0 if not found)
     */
    function getLocationIdBySlug(string calldata slug) external view returns (uint256) {
        return _slugToId[slug];
    }

    /**
     * @dev Get total number of locations created
     * @return Total locations (nextLocationId - 1)
     */
    function totalLocations() external view returns (uint256) {
        return _nextLocationId - 1;
    }

    /**
     * @dev List locations with pagination
     * @param offset Starting offset
     * @param limit Maximum number of locations to return
     * @return Array of locations
     */
    function listLocations(uint256 offset, uint256 limit) external view returns (Location[] memory) {
        uint256 total = _nextLocationId - 1;
        if (offset >= total) {
            return new Location[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 count = end - offset;
        Location[] memory locations = new Location[](count);

        for (uint256 i = 0; i < count; i++) {
            locations[i] = _locations[offset + i + 1];
        }

        return locations;
    }

    /**
     * @dev List child locations of a parent
     * @param parentId Parent location ID
     * @return Array of child locations
     */
    function listChildren(uint256 parentId) external view returns (Location[] memory) {
        uint256 total = _nextLocationId - 1;
        uint256 count = 0;

        // First pass: count children
        for (uint256 i = 1; i <= total; i++) {
            if (_locations[i].parentLocationId == parentId) {
                count++;
            }
        }

        // Second pass: collect children
        Location[] memory children = new Location[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (_locations[i].parentLocationId == parentId) {
                children[index] = _locations[i];
                index++;
            }
        }

        return children;
    }
}

