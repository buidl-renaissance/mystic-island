// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MagicToken
 * @dev ERC20 token called Magic, used to power up Totems and reward player actions
 */
contract MagicToken is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public isMinter;

    event MinterUpdated(address indexed account, bool allowed);

    /**
     * @dev Constructor sets the token name and symbol, and transfers ownership
     * @param owner_ The address that will own this contract
     */
    constructor(address owner_) ERC20("Magic", "MAGIC") Ownable(owner_) {
    }

    /**
     * @dev Allows the owner to grant or revoke minter status
     * @param account The address to set minter status for
     * @param allowed Whether the account should be allowed to mint
     */
    function setMinter(address account, bool allowed) external onlyOwner {
        isMinter[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    /**
     * @dev Mints tokens to the specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(isMinter[msg.sender], "MagicToken: not minter");
        _mint(to, amount);
    }
}

