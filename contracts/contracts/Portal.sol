// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LocationRegistry.sol";
import "./LocationUnlock.sol";

/**
 * @title Portal
 * @dev Handles portal activation for chainlet transitions
 */
contract Portal {
    LocationRegistry public locationRegistry;
    LocationUnlock public locationUnlock;

    // Portal configuration
    struct PortalConfig {
        uint256 sourceLocationId; // Location ID where portal is located (planetarium)
        uint256 targetChainletId; // Chain ID of target chainlet
        string targetLocationSlug; // Slug of target location on destination chainlet
        bool isActive; // Whether portal is active
    }

    // Mapping: portal ID => portal config
    mapping(uint256 => PortalConfig) public portals;
    uint256 private _nextPortalId = 1;

    event PortalActivated(
        address indexed player,
        uint256 indexed portalId,
        uint256 indexed sourceLocationId,
        uint256 targetChainletId,
        string targetLocationSlug
    );

    event PortalCreated(
        uint256 indexed portalId,
        uint256 indexed sourceLocationId,
        uint256 targetChainletId,
        string targetLocationSlug
    );

    /**
     * @dev Constructor sets the location registry and unlock contract
     * @param locationRegistry_ The address of the LocationRegistry contract
     * @param locationUnlock_ The address of the LocationUnlock contract
     */
    constructor(address locationRegistry_, address locationUnlock_) {
        locationRegistry = LocationRegistry(locationRegistry_);
        locationUnlock = LocationUnlock(locationUnlock_);
    }

    /**
     * @dev Create a new portal
     * @param sourceLocationId The location ID where the portal is located
     * @param targetChainletId The chain ID of the target chainlet
     * @param targetLocationSlug The slug of the target location on destination chainlet
     * @return The portal ID
     */
    function createPortal(
        uint256 sourceLocationId,
        uint256 targetChainletId,
        string calldata targetLocationSlug
    ) external returns (uint256) {
        require(
            locationRegistry.locationExists(sourceLocationId),
            "Portal: source location does not exist"
        );
        require(bytes(targetLocationSlug).length > 0, "Portal: target location slug cannot be empty");

        uint256 portalId = _nextPortalId;
        _nextPortalId += 1;

        portals[portalId] = PortalConfig({
            sourceLocationId: sourceLocationId,
            targetChainletId: targetChainletId,
            targetLocationSlug: targetLocationSlug,
            isActive: true
        });

        emit PortalCreated(portalId, sourceLocationId, targetChainletId, targetLocationSlug);

        return portalId;
    }

    /**
     * @dev Activate a portal (player must be at source location and have it unlocked)
     * @param portalId The portal ID to activate
     */
    function activatePortal(uint256 portalId) external {
        require(portals[portalId].isActive, "Portal: portal is not active");

        PortalConfig memory portal = portals[portalId];

        // Verify source location exists and is active
        require(
            locationRegistry.locationExists(portal.sourceLocationId),
            "Portal: source location does not exist"
        );

        LocationRegistry.Location memory sourceLocation = locationRegistry.getLocation(
            portal.sourceLocationId
        );
        require(sourceLocation.isActive, "Portal: source location is not active");

        // Verify player has unlocked the source location
        require(
            locationUnlock.canAccessLocation(msg.sender, portal.sourceLocationId),
            "Portal: source location is not unlocked"
        );

        emit PortalActivated(
            msg.sender,
            portalId,
            portal.sourceLocationId,
            portal.targetChainletId,
            portal.targetLocationSlug
        );
    }

    /**
     * @dev Get portal configuration
     * @param portalId The portal ID
     * @return Portal configuration struct
     */
    function getPortal(uint256 portalId) external view returns (PortalConfig memory) {
        require(portalId > 0 && portalId < _nextPortalId, "Portal: portal does not exist");
        return portals[portalId];
    }

    /**
     * @dev Find portal by source location ID
     * @param sourceLocationId The source location ID
     * @return portalId The portal ID (0 if not found)
     */
    function findPortalBySourceLocation(
        uint256 sourceLocationId
    ) external view returns (uint256) {
        for (uint256 i = 1; i < _nextPortalId; i++) {
            if (portals[i].sourceLocationId == sourceLocationId && portals[i].isActive) {
                return i;
            }
        }
        return 0;
    }

    /**
     * @dev Set portal active status (for admin use)
     * @param portalId The portal ID
     * @param active Active status
     */
    function setPortalActive(uint256 portalId, bool active) external {
        require(portalId > 0 && portalId < _nextPortalId, "Portal: portal does not exist");
        portals[portalId].isActive = active;
    }

    /**
     * @dev Get total number of portals
     * @return Total portals (nextPortalId - 1)
     */
    function totalPortals() external view returns (uint256) {
        return _nextPortalId - 1;
    }
}

