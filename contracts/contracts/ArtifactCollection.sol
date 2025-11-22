// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtifactCollection
 * @dev ERC721 contract for unique artifacts that players can create and combine into Totems
 */
contract ArtifactCollection is ERC721, ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    event ArtifactMinted(address indexed to, uint256 indexed tokenId, string uri);

    /**
     * @dev Constructor sets the token name and symbol, and transfers ownership
     * @param owner_ The address that will own this contract
     */
    constructor(address owner_) ERC721("Artifact", "ARTIFACT") Ownable(owner_) {
    }

    /**
     * @dev Mints a new artifact NFT to the specified address
     * @param to The address to mint the artifact to
     * @param uri The URI for the artifact's metadata
     * @return The token ID of the newly minted artifact
     */
    function mintArtifact(address to, string calldata uri) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId += 1;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit ArtifactMinted(to, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Override required for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

