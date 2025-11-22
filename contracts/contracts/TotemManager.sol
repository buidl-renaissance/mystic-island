// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IArtifactCollection is IERC721 {
    // no extra functions required for now
}

interface IMagicToken is IERC20 {
    function burn(uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

/**
 * @title TotemManager
 * @dev Manages Totems created by combining Artifacts and allows powering them up with Magic
 */
contract TotemManager is ReentrancyGuard, Ownable {

    struct Totem {
        uint256 id;
        address creator;        // who created the totem
        uint256[] artifactIds;  // artifacts bound to this totem
        uint256 power;          // aggregate power score
    }

    IArtifactCollection public artifacts;
    IMagicToken public magic;

    uint256 public nextTotemId = 1; // Start at 1 so 0 can be used as sentinel

    // artifactId => totemId (0 means no totem)
    mapping(uint256 => uint256) public artifactToTotem;

    // totemId => Totem struct
    mapping(uint256 => Totem) private _totems;

    event TotemCreated(address indexed creator, uint256 indexed totemId, uint256[] artifactIds);
    event ArtifactAddedToTotem(address indexed sender, uint256 indexed totemId, uint256 indexed artifactId);
    event TotemPoweredUp(address indexed sender, uint256 indexed totemId, uint256 magicSpent, uint256 newPower);
    event TotemPowerOverridden(uint256 indexed totemId, uint256 newPower);

    /**
     * @dev Constructor sets the owner and initializes contract references
     * @param owner_ The address that will own this contract
     * @param artifactContract The address of the ArtifactCollection contract
     * @param magicToken The address of the MagicToken contract
     */
    constructor(
        address owner_,
        address artifactContract,
        address magicToken
    ) Ownable(owner_) {
        artifacts = IArtifactCollection(artifactContract);
        magic = IMagicToken(magicToken);
    }

    /**
     * @dev Returns basic totem information
     * @param totemId The ID of the totem to query
     * @return id The totem ID
     * @return creator The address that created the totem
     * @return power The current power of the totem
     * @return artifactCount The number of artifacts bound to this totem
     */
    function getTotem(uint256 totemId) external view returns (
        uint256 id,
        address creator,
        uint256 power,
        uint256 artifactCount
    ) {
        Totem storage t = _totems[totemId];
        return (t.id, t.creator, t.power, t.artifactIds.length);
    }

    /**
     * @dev Returns the artifact IDs bound to a totem
     * @param totemId The ID of the totem to query
     * @return The array of artifact IDs
     */
    function getTotemArtifactIds(uint256 totemId) external view returns (uint256[] memory) {
        return _totems[totemId].artifactIds;
    }

    /**
     * @dev Creates a new totem by combining multiple artifacts
     * @param artifactIds Array of artifact IDs to combine into the totem
     * @return The ID of the newly created totem
     */
    function createTotem(uint256[] calldata artifactIds) external nonReentrant returns (uint256) {
        require(artifactIds.length > 0, "Must provide at least one artifact");

        // Validate ownership and availability of all artifacts
        for (uint256 i = 0; i < artifactIds.length; i++) {
            uint256 artifactId = artifactIds[i];
            require(artifacts.ownerOf(artifactId) == msg.sender, "Not artifact owner");
            require(artifactToTotem[artifactId] == 0, "Artifact already in totem");
        }

        uint256 totemId = nextTotemId;
        nextTotemId += 1; // Increment for next totem

        Totem storage t = _totems[totemId];
        t.id = totemId;
        t.creator = msg.sender;
        t.power = artifactIds.length; // base power = number of artifacts

        // Bind artifacts to totem
        for (uint256 i = 0; i < artifactIds.length; i++) {
            uint256 artifactId = artifactIds[i];
            t.artifactIds.push(artifactId);
            artifactToTotem[artifactId] = totemId;
        }

        emit TotemCreated(msg.sender, totemId, artifactIds);

        return totemId;
    }

    /**
     * @dev Adds an artifact to an existing totem
     * @param totemId The ID of the totem to add the artifact to
     * @param artifactId The ID of the artifact to add
     */
    function addArtifact(uint256 totemId, uint256 artifactId) external nonReentrant {
        require(totemId < nextTotemId, "Invalid totem ID");
        require(artifacts.ownerOf(artifactId) == msg.sender, "Not artifact owner");
        require(artifactToTotem[artifactId] == 0, "Artifact already in totem");

        Totem storage t = _totems[totemId];
        t.artifactIds.push(artifactId);
        artifactToTotem[artifactId] = totemId;
        t.power += 1; // increment power by 1

        emit ArtifactAddedToTotem(msg.sender, totemId, artifactId);
    }

    /**
     * @dev Powers up a totem by spending Magic tokens
     * @param totemId The ID of the totem to power up
     * @param magicAmount The amount of Magic to spend
     */
    function powerUp(uint256 totemId, uint256 magicAmount) external nonReentrant {
        require(magicAmount > 0, "Amount must be greater than zero");
        require(totemId < nextTotemId, "Invalid totem ID");

        // Transfer Magic from caller to this contract
        magic.transferFrom(msg.sender, address(this), magicAmount);
        
        // Burn the Magic
        magic.burn(magicAmount);

        // Increase totem power
        Totem storage t = _totems[totemId];
        t.power += magicAmount;

        emit TotemPoweredUp(msg.sender, totemId, magicAmount, t.power);
    }

    /**
     * @dev Admin function to override a totem's power (for emergency balancing)
     * @param totemId The ID of the totem
     * @param newPower The new power value to set
     */
    function adminSetPower(uint256 totemId, uint256 newPower) external onlyOwner {
        require(totemId < nextTotemId, "Invalid totem ID");
        _totems[totemId].power = newPower;
        emit TotemPowerOverridden(totemId, newPower);
    }
}

