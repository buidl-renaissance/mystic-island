// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IArtifactCollection is IERC721 {
    function mintArtifact(address to, string calldata uri) external returns (uint256);
}

/**
 * @title TribeManager
 * @dev Manages tribes, initiation artifacts, and member artifact minting
 */
contract TribeManager is Ownable, ReentrancyGuard {
    IArtifactCollection public artifacts;

    struct Tribe {
        uint256 id;
        string name;
        address leader;
        bool requiresApproval;
        bool active;
        uint256 quorumThreshold; // Number of approvals needed (0 = leader/owner only)
    }

    struct JoinRequest {
        uint256 id;
        uint256 tribeId;
        address applicant;
        uint256 initiationArtifactId;
        bool approved;
        bool processed;
        uint256 approvalCount;
        uint256 rejectionCount;
    }

    // requestId => (voter address => has voted)
    mapping(uint256 => mapping(address => bool)) public hasVotedOnRequest;
    
    // requestId => (voter address => approved)
    mapping(uint256 => mapping(address => bool)) public requestVotes;

    uint256 public nextTribeId = 1; // Start at 1
    uint256 public nextJoinRequestId = 1; // Start at 1

    // tribeId => Tribe
    mapping(uint256 => Tribe) public tribes;

    // tribeId => (member address => isMember)
    mapping(uint256 => mapping(address => bool)) public isMember;

    // One initiation artifact per address
    mapping(address => bool) public hasCreatedInitialArtifact;

    // True if user is approved in at least one tribe
    mapping(address => bool) public isApprovedInAnyTribe;

    // joinRequestId => JoinRequest
    mapping(uint256 => JoinRequest) public joinRequests;

    event TribeCreated(
        uint256 indexed tribeId,
        string name,
        address indexed leader,
        bool requiresApproval
    );
    event TribeLeaderUpdated(
        uint256 indexed tribeId,
        address indexed newLeader
    );
    event JoinRequested(
        uint256 indexed requestId,
        uint256 indexed tribeId,
        address indexed applicant,
        uint256 initiationArtifactId
    );
    event JoinApproved(
        uint256 indexed requestId,
        uint256 indexed tribeId,
        address indexed applicant
    );
    event JoinRejected(
        uint256 indexed requestId,
        uint256 indexed tribeId,
        address indexed applicant
    );
    event MemberArtifactMinted(
        uint256 indexed tribeId,
        address indexed member,
        uint256 indexed tokenId
    );
    event VoteCast(
        uint256 indexed requestId,
        address indexed voter,
        bool approved,
        uint256 approvalCount,
        uint256 rejectionCount
    );

    /**
     * @dev Constructor sets the owner and artifact collection address
     * @param owner_ The address that will own this contract
     * @param artifactCollection The address of the ArtifactCollection contract
     */
    constructor(address owner_, address artifactCollection) Ownable(owner_) {
        artifacts = IArtifactCollection(artifactCollection);
    }

    /**
     * @dev Creates a new tribe
     * @param name The name of the tribe
     * @param leader The address of the tribe leader
     * @param requiresApproval Whether join requests require approval
     * @param quorumThreshold Number of member approvals needed (0 = leader/owner only)
     * @return The ID of the newly created tribe
     */
    function createTribe(
        string calldata name,
        address leader,
        bool requiresApproval,
        uint256 quorumThreshold
    ) external onlyOwner returns (uint256) {
        uint256 tribeId = nextTribeId;
        nextTribeId += 1;

        tribes[tribeId] = Tribe({
            id: tribeId,
            name: name,
            leader: leader,
            requiresApproval: requiresApproval,
            active: true,
            quorumThreshold: quorumThreshold
        });

        emit TribeCreated(tribeId, name, leader, requiresApproval);

        return tribeId;
    }

    /**
     * @dev Updates the leader of a tribe
     * @param tribeId The ID of the tribe
     * @param newLeader The new leader address
     */
    function setTribeLeader(uint256 tribeId, address newLeader) external onlyOwner {
        require(tribes[tribeId].active == true, "Tribe not active");
        tribes[tribeId].leader = newLeader;
        emit TribeLeaderUpdated(tribeId, newLeader);
    }

    /**
     * @dev Requests to join a tribe and mints an initiation artifact
     * @param tribeId The ID of the tribe to join
     * @param initiationArtifactUri The URI for the initiation artifact metadata
     * @return The ID of the join request
     */
    function requestToJoinTribe(
        uint256 tribeId,
        string calldata initiationArtifactUri
    ) external nonReentrant returns (uint256) {
        require(tribes[tribeId].active == true, "Tribe not active");
        require(!hasCreatedInitialArtifact[msg.sender], "Already initiated");

        // Mint initiation artifact
        uint256 artifactId = artifacts.mintArtifact(msg.sender, initiationArtifactUri);

        // Mark that they've created their initial artifact
        hasCreatedInitialArtifact[msg.sender] = true;

        // Create join request
        uint256 requestId = nextJoinRequestId;
        nextJoinRequestId += 1;

        joinRequests[requestId] = JoinRequest({
            id: requestId,
            tribeId: tribeId,
            applicant: msg.sender,
            initiationArtifactId: artifactId,
            approved: false,
            processed: false,
            approvalCount: 0,
            rejectionCount: 0
        });

        emit JoinRequested(requestId, tribeId, msg.sender, artifactId);

        return requestId;
    }

    /**
     * @dev Votes on a join request (approve or reject)
     * @param requestId The ID of the join request
     * @param approved True to approve, false to reject
     */
    function voteOnJoinRequest(uint256 requestId, bool approved) external nonReentrant {
        JoinRequest storage req = joinRequests[requestId];
        require(!req.processed, "Already processed");

        Tribe storage tribe = tribes[req.tribeId];
        
        // Check if voter is a tribe member, leader, or owner
        require(
            isMember[req.tribeId][msg.sender] || 
            msg.sender == tribe.leader || 
            msg.sender == owner(),
            "Not tribe member, leader, or owner"
        );

        // Check if already voted
        require(!hasVotedOnRequest[requestId][msg.sender], "Already voted");

        // Record vote
        hasVotedOnRequest[requestId][msg.sender] = true;
        requestVotes[requestId][msg.sender] = approved;

        // Update counts
        if (approved) {
            req.approvalCount += 1;
        } else {
            req.rejectionCount += 1;
        }

        emit VoteCast(requestId, msg.sender, approved, req.approvalCount, req.rejectionCount);

        // Check if quorum is reached
        if (tribe.quorumThreshold > 0) {
            // Quorum-based approval: need quorumThreshold approvals
            if (req.approvalCount >= tribe.quorumThreshold) {
                req.processed = true;
                req.approved = true;
                isMember[req.tribeId][req.applicant] = true;
                isApprovedInAnyTribe[req.applicant] = true;
                emit JoinApproved(requestId, req.tribeId, req.applicant);
            }
        } else {
            // Leader/owner only: leader or owner can directly approve/reject
            if (msg.sender == tribe.leader || msg.sender == owner()) {
                req.processed = true;
                req.approved = approved;
                if (approved) {
                    isMember[req.tribeId][req.applicant] = true;
                    isApprovedInAnyTribe[req.applicant] = true;
                    emit JoinApproved(requestId, req.tribeId, req.applicant);
                } else {
                    emit JoinRejected(requestId, req.tribeId, req.applicant);
                }
            }
        }
    }

    /**
     * @dev Approves a join request (legacy function for leader/owner direct approval)
     * @param requestId The ID of the join request to approve
     */
    function approveJoinRequest(uint256 requestId) external nonReentrant {
        JoinRequest storage req = joinRequests[requestId];
        require(!req.processed, "Already processed");

        Tribe storage tribe = tribes[req.tribeId];
        require(
            msg.sender == tribe.leader || msg.sender == owner(),
            "Not tribe leader or owner"
        );

        req.processed = true;
        req.approved = true;

        // Set membership
        isMember[req.tribeId][req.applicant] = true;
        isApprovedInAnyTribe[req.applicant] = true;

        emit JoinApproved(requestId, req.tribeId, req.applicant);
    }

    /**
     * @dev Rejects a join request (legacy function for leader/owner direct rejection)
     * @param requestId The ID of the join request to reject
     */
    function rejectJoinRequest(uint256 requestId) external nonReentrant {
        JoinRequest storage req = joinRequests[requestId];
        require(!req.processed, "Already processed");

        Tribe storage tribe = tribes[req.tribeId];
        require(
            msg.sender == tribe.leader || msg.sender == owner(),
            "Not tribe leader or owner"
        );

        req.processed = true;
        req.approved = false;

        emit JoinRejected(requestId, req.tribeId, req.applicant);
    }

    /**
     * @dev Mints an additional artifact for an approved tribe member
     * @param tribeId The ID of the tribe
     * @param uri The URI for the artifact metadata
     * @return The token ID of the newly minted artifact
     */
    function mintMemberArtifact(
        uint256 tribeId,
        string calldata uri
    ) external nonReentrant returns (uint256) {
        require(tribes[tribeId].active == true, "Tribe not active");
        require(isMember[tribeId][msg.sender], "Not tribe member");

        uint256 tokenId = artifacts.mintArtifact(msg.sender, uri);

        emit MemberArtifactMinted(tribeId, msg.sender, tokenId);

        return tokenId;
    }

    /**
     * @dev Directly adds a member to a tribe (owner only)
     * @param tribeId The ID of the tribe
     * @param member The address to add as a member
     */
    function addMemberDirectly(uint256 tribeId, address member) external onlyOwner {
        require(tribes[tribeId].active == true, "Tribe not active");
        require(!isMember[tribeId][member], "Already a member");

        isMember[tribeId][member] = true;
        isApprovedInAnyTribe[member] = true;

        emit JoinApproved(0, tribeId, member); // Use 0 as requestId for direct additions
    }

    /**
     * @dev Checks if an address is a member of a tribe
     * @param tribeId The ID of the tribe
     * @param account The address to check
     * @return Whether the address is a member
     */
    function isTribeMember(uint256 tribeId, address account) external view returns (bool) {
        return isMember[tribeId][account];
    }

    /**
     * @dev Gets tribe information
     * @param tribeId The ID of the tribe
     * @return name The name of the tribe
     * @return leader The leader address
     * @return requiresApproval Whether approval is required
     * @return active Whether the tribe is active
     * @return quorumThreshold The quorum threshold for approvals
     */
    function getTribe(uint256 tribeId) external view returns (
        string memory name,
        address leader,
        bool requiresApproval,
        bool active,
        uint256 quorumThreshold
    ) {
        Tribe storage tribe = tribes[tribeId];
        return (tribe.name, tribe.leader, tribe.requiresApproval, tribe.active, tribe.quorumThreshold);
    }

    /**
     * @dev Gets join request information
     * @param requestId The ID of the join request
     * @return tribeId The tribe ID
     * @return applicant The applicant address
     * @return initiationArtifactId The initiation artifact ID
     * @return approved Whether the request is approved
     * @return processed Whether the request has been processed
     * @return approvalCount Number of approval votes
     * @return rejectionCount Number of rejection votes
     */
    function getJoinRequest(uint256 requestId) external view returns (
        uint256 tribeId,
        address applicant,
        uint256 initiationArtifactId,
        bool approved,
        bool processed,
        uint256 approvalCount,
        uint256 rejectionCount
    ) {
        JoinRequest storage req = joinRequests[requestId];
        return (
            req.tribeId,
            req.applicant,
            req.initiationArtifactId,
            req.approved,
            req.processed,
            req.approvalCount,
            req.rejectionCount
        );
    }

    /**
     * @dev Gets the number of members in a tribe
     * @param tribeId The ID of the tribe
     * @return count The number of members (approximate, requires iteration)
     */
    function getTribeMemberCount(uint256 tribeId) external view returns (uint256 count) {
        // Note: This is a simplified version. In production, you might want to maintain a counter
        // For now, this would require iterating which is gas-intensive
        // Returning 0 as placeholder - can be enhanced with a member counter
        return 0;
    }
}

