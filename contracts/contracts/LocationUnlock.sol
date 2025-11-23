// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LocationRegistry.sol";

/**
 * @title LocationUnlock
 * @dev Tracks which locations players have unlocked and automatically unlocks child locations
 */
contract LocationUnlock is AccessControl {
    LocationRegistry public locationRegistry;
    bytes32 public constant UNLOCK_ADMIN_ROLE = keccak256("UNLOCK_ADMIN_ROLE");

    // Mapping: player address => location ID => unlocked status
    mapping(address => mapping(uint256 => bool)) public unlockedLocations;

    // Track all unlocked location IDs per player for efficient queries
    mapping(address => uint256[]) private _playerUnlockedIds;
    mapping(address => mapping(uint256 => bool)) private _playerHasUnlocked; // For O(1) check in array

    event LocationUnlocked(address indexed player, uint256 indexed locationId);

    /**
     * @dev Constructor sets the location registry and admin
     * @param locationRegistry_ The address of the LocationRegistry contract
     * @param admin_ The address that will have admin roles
     */
    constructor(address locationRegistry_, address admin_) {
        locationRegistry = LocationRegistry(locationRegistry_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(UNLOCK_ADMIN_ROLE, admin_);
    }

    /**
     * @dev Unlock a location for a player
     * @param locationId The location ID to unlock
     */
    function unlockLocation(uint256 locationId) external {
        require(
            locationRegistry.locationExists(locationId),
            "LocationUnlock: location does not exist"
        );

        LocationRegistry.Location memory location = locationRegistry.getLocation(locationId);
        require(location.isActive, "LocationUnlock: location is not active");

        // If already unlocked, return early
        if (unlockedLocations[msg.sender][locationId]) {
            return;
        }

        // Unlock the location
        unlockedLocations[msg.sender][locationId] = true;

        // Add to player's unlocked list if not already tracked
        if (!_playerHasUnlocked[msg.sender][locationId]) {
            _playerUnlockedIds[msg.sender].push(locationId);
            _playerHasUnlocked[msg.sender][locationId] = true;
        }

        emit LocationUnlocked(msg.sender, locationId);

        // Automatically unlock all child locations
        _unlockChildLocations(msg.sender, locationId);
    }

    /**
     * @dev Unlock a location and all its children (internal helper)
     * @param player The player address
     * @param parentLocationId The parent location ID
     */
    function _unlockChildLocations(address player, uint256 parentLocationId) internal {
        LocationRegistry.Location[] memory children = locationRegistry.listChildren(parentLocationId);

        for (uint256 i = 0; i < children.length; i++) {
            uint256 childId = children[i].id;

            // Skip if already unlocked
            if (unlockedLocations[player][childId]) {
                continue;
            }

            // Only unlock if child is active
            if (!children[i].isActive) {
                continue;
            }

            // Unlock the child location
            unlockedLocations[player][childId] = true;

            // Add to player's unlocked list if not already tracked
            if (!_playerHasUnlocked[player][childId]) {
                _playerUnlockedIds[player].push(childId);
                _playerHasUnlocked[player][childId] = true;
            }

            emit LocationUnlocked(player, childId);

            // Recursively unlock grandchildren
            _unlockChildLocations(player, childId);
        }
    }

    /**
     * @dev Check if a player can access a location
     * @param player The player address
     * @param locationId The location ID to check
     * @return True if the location is unlocked for the player
     */
    function canAccessLocation(address player, uint256 locationId) external view returns (bool) {
        if (!locationRegistry.locationExists(locationId)) {
            return false;
        }

        LocationRegistry.Location memory location = locationRegistry.getLocation(locationId);
        if (!location.isActive) {
            return false;
        }

        return unlockedLocations[player][locationId];
    }

    /**
     * @dev Get all unlocked location IDs for a player
     * @param player The player address
     * @return Array of unlocked location IDs
     */
    function getUnlockedLocations(address player) external view returns (uint256[] memory) {
        return _playerUnlockedIds[player];
    }

    /**
     * @dev Check if multiple locations are unlocked for a player
     * @param player The player address
     * @param locationIds Array of location IDs to check
     * @return Array of booleans indicating unlock status for each location
     */
    function areLocationsUnlocked(
        address player,
        uint256[] calldata locationIds
    ) external view returns (bool[] memory) {
        bool[] memory results = new bool[](locationIds.length);

        for (uint256 i = 0; i < locationIds.length; i++) {
            results[i] = unlockedLocations[player][locationIds[i]];
        }

        return results;
    }

    /**
     * @dev Get count of unlocked locations for a player
     * @param player The player address
     * @return Number of unlocked locations
     */
    function getUnlockedCount(address player) external view returns (uint256) {
        return _playerUnlockedIds[player].length;
    }

    /**
     * @dev Admin function to unlock a location for a specific player
     * @param player The player address to unlock for
     * @param locationId The location ID to unlock
     */
    function adminUnlockLocation(address player, uint256 locationId) external onlyRole(UNLOCK_ADMIN_ROLE) {
        require(
            locationRegistry.locationExists(locationId),
            "LocationUnlock: location does not exist"
        );

        LocationRegistry.Location memory location = locationRegistry.getLocation(locationId);
        require(location.isActive, "LocationUnlock: location is not active");

        // If already unlocked, return early
        if (unlockedLocations[player][locationId]) {
            return;
        }

        // Unlock the location
        unlockedLocations[player][locationId] = true;

        // Add to player's unlocked list if not already tracked
        if (!_playerHasUnlocked[player][locationId]) {
            _playerUnlockedIds[player].push(locationId);
            _playerHasUnlocked[player][locationId] = true;
        }

        emit LocationUnlocked(player, locationId);

        // Automatically unlock all child locations
        _unlockChildLocations(player, locationId);
    }
}

