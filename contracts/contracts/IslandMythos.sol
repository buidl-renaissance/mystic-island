// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IslandMythos
 * @dev Canonical source of truth for the island's mythos, theme, and lore
 */
contract IslandMythos is AccessControl {
    bytes32 public constant MYTHOS_EDITOR_ROLE = keccak256("MYTHOS_EDITOR_ROLE");

    struct MythosData {
        string islandName;      // e.g. "Mystic Island"
        string shortTheme;      // e.g. "A collaborative myth-forging island where artifacts awaken dormant totems."
        string artDirection;    // e.g. "magical realism, bioluminescent nature, soft dusk lighting"
        string coreMyth;        // 1–3 sentence narrative summary
        string loreURI;         // IPFS / HTTPS URI with extended lore + JSON config
        bool initialized;       // Has the mythos been set?
        bool locked;           // If locked, no more structural edits (name, theme, coreMyth)
    }

    MythosData private _mythos;

    event MythosInitialized(
        string islandName,
        string shortTheme,
        string artDirection,
        string coreMyth,
        string loreURI,
        address indexed editor
    );

    event MythosUpdated(
        string islandName,
        string shortTheme,
        string artDirection,
        string coreMyth,
        address indexed editor
    );

    event LoreURIUpdated(string newLoreURI, address indexed editor);

    event MythosLocked(address indexed admin);

    /**
     * @dev Constructor sets the admin role
     * @param admin_ The address that will have DEFAULT_ADMIN_ROLE
     */
    constructor(address admin_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(MYTHOS_EDITOR_ROLE, admin_);
    }

    /**
     * @dev Initialize the mythos (can only be called once)
     * @param islandName The name of the island
     * @param shortTheme Short theme description
     * @param artDirection Art direction guidelines
     * @param coreMyth Core myth narrative (1-3 sentences)
     * @param loreURI URI to extended lore JSON
     */
    function initializeMythos(
        string calldata islandName,
        string calldata shortTheme,
        string calldata artDirection,
        string calldata coreMyth,
        string calldata loreURI
    ) external onlyRole(MYTHOS_EDITOR_ROLE) {
        require(!_mythos.initialized, "IslandMythos: already initialized");

        _mythos = MythosData({
            islandName: islandName,
            shortTheme: shortTheme,
            artDirection: artDirection,
            coreMyth: coreMyth,
            loreURI: loreURI,
            initialized: true,
            locked: false
        });

        emit MythosInitialized(islandName, shortTheme, artDirection, coreMyth, loreURI, msg.sender);
    }

    /**
     * @dev Update mythos fields (cannot update if locked)
     * @param newIslandName New island name (empty string to keep current)
     * @param newShortTheme New short theme (empty string to keep current)
     * @param newArtDirection New art direction (empty string to keep current)
     * @param newCoreMyth New core myth (empty string to keep current)
     */
    function updateMythos(
        string calldata newIslandName,
        string calldata newShortTheme,
        string calldata newArtDirection,
        string calldata newCoreMyth
    ) external onlyRole(MYTHOS_EDITOR_ROLE) {
        require(_mythos.initialized, "IslandMythos: not initialized");
        require(!_mythos.locked, "IslandMythos: mythos is locked");

        if (bytes(newIslandName).length > 0) {
            _mythos.islandName = newIslandName;
        }
        if (bytes(newShortTheme).length > 0) {
            _mythos.shortTheme = newShortTheme;
        }
        if (bytes(newArtDirection).length > 0) {
            _mythos.artDirection = newArtDirection;
        }
        if (bytes(newCoreMyth).length > 0) {
            _mythos.coreMyth = newCoreMyth;
        }

        emit MythosUpdated(_mythos.islandName, _mythos.shortTheme, _mythos.artDirection, _mythos.coreMyth, msg.sender);
    }

    /**
     * @dev Update the lore URI (allowed even after locked)
     * @param newLoreURI New lore URI
     */
    function updateLoreURI(string calldata newLoreURI) external onlyRole(MYTHOS_EDITOR_ROLE) {
        require(_mythos.initialized, "IslandMythos: not initialized");

        _mythos.loreURI = newLoreURI;

        emit LoreURIUpdated(newLoreURI, msg.sender);
    }

    /**
     * @dev Lock the mythos to prevent further structural edits
     */
    function lockMythos() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_mythos.initialized, "IslandMythos: not initialized");
        require(!_mythos.locked, "IslandMythos: already locked");

        _mythos.locked = true;

        emit MythosLocked(msg.sender);
    }

    /**
     * @dev Get the full mythos data
     * @return The mythos data struct
     */
    function getMythos() external view returns (MythosData memory) {
        return _mythos;
    }

    /**
     * @dev Check if mythos is initialized
     * @return True if initialized
     */
    function isInitialized() external view returns (bool) {
        return _mythos.initialized;
    }

    /**
     * @dev Check if mythos is locked
     * @return True if locked
     */
    function isLocked() external view returns (bool) {
        return _mythos.locked;
    }

    /**
     * @dev Get island name
     * @return The island name
     */
    function islandName() external view returns (string memory) {
        return _mythos.islandName;
    }

    /**
     * @dev Get short theme
     * @return The short theme
     */
    function shortTheme() external view returns (string memory) {
        return _mythos.shortTheme;
    }

    /**
     * @dev Get art direction
     * @return The art direction
     */
    function artDirection() external view returns (string memory) {
        return _mythos.artDirection;
    }

    /**
     * @dev Get core myth
     * @return The core myth
     */
    function coreMyth() external view returns (string memory) {
        return _mythos.coreMyth;
    }

    /**
     * @dev Get lore URI
     * @return The lore URI
     */
    function loreURI() external view returns (string memory) {
        return _mythos.loreURI;
    }
}

