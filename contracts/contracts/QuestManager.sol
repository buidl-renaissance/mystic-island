// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMagicToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title QuestManager
 * @dev Handles quest reward claims using signature verification from off-chain systems
 */
contract QuestManager is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IMagicToken public magic;
    address public attestor; // signer address used by the game backend or AI agent

    // messageHash => used?
    mapping(bytes32 => bool) public usedMessages;

    event AttestorUpdated(address indexed attestor);
    event RewardClaimed(address indexed player, uint256 indexed questId, uint256 amount, bytes32 message);

    /**
     * @dev Constructor sets the owner, magic token, and attestor address
     * @param owner_ The address that will own this contract
     * @param magicToken The address of the MagicToken contract
     * @param attestor_ The address that will sign quest completion messages
     */
    constructor(address owner_, address magicToken, address attestor_) Ownable(owner_) {
        magic = IMagicToken(magicToken);
        attestor = attestor_;
    }

    /**
     * @dev Updates the attestor address (only owner)
     * @param newAttestor The new attestor address
     */
    function setAttestor(address newAttestor) external onlyOwner {
        attestor = newAttestor;
        emit AttestorUpdated(newAttestor);
    }

    /**
     * @dev Claims a quest reward using a signature from the attestor
     * @param player The address of the player claiming the reward
     * @param questId The ID of the quest that was completed
     * @param amount The amount of Magic to reward
     * @param signature The signature from the attestor
     */
    function claimReward(
        address player,
        uint256 questId,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        require(amount > 0, "Zero amount");

        // Compute message hash
        bytes32 message = keccak256(
            abi.encodePacked(
                player,
                questId,
                amount,
                address(this),
                block.chainid
            )
        );

        // Convert to Ethereum signed message hash
        bytes32 ethSigned = message.toEthSignedMessageHash();

        // Recover signer
        address recovered = ethSigned.recover(signature);

        require(recovered == attestor, "Invalid attestor signature");
        require(!usedMessages[message], "Reward already claimed");

        // Mark message as used
        usedMessages[message] = true;

        // Mint Magic to player
        magic.mint(player, amount);

        emit RewardClaimed(player, questId, amount, message);
    }
}

