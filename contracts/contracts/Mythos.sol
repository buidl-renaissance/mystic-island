// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Mythos
 * @dev Interface for Mythos contract
 */
interface Mythos {
    function isInitialized() external view returns (bool);
    function isLocked() external view returns (bool);
    function islandName() external view returns (string memory);
    function shortTheme() external view returns (string memory);
    function artDirection() external view returns (string memory);
    function coreMyth() external view returns (string memory);
    function loreURI() external view returns (string memory);
}

