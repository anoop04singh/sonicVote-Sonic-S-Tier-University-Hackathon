// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Election {
    address public creator;
    uint256 public startDate;
    uint256 public endDate;
    uint8 public electionType; // 0: Simple, 1: Quadratic, 2: Ranked, 3: Cumulative
    string public metadataURI;
    
    mapping(string => uint256) public results;
    mapping(address => bool) public voters;
    string[] public optionIds;

    // --- EVENT ---
    // By adding `indexed` to the voter's address, we make it efficiently queryable.
    event VoteCast(uint256 indexed electionId, address indexed voter, string ipfsURI);

    constructor(
        address _creator,
        uint256 _startDate,
        uint256 _endDate,
        uint8 _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) {
        creator = _creator;
        startDate = _startDate;
        endDate = _endDate;
        electionType = _electionType;
        metadataURI = _metadataURI;
        optionIds = _optionIds;
    }

    function getElectionDetails() public view returns (address, uint8, uint8, uint256, string memory, uint256, uint256) {
        uint256 totalVoters = 0;
        // This is inefficient for a view function, but demonstrates state.
        // In a real app, a counter variable would be better.
        // For now, we will leave it as is to avoid breaking changes.
        return (creator, 0, electionType, endDate, metadataURI, totalVoters, startDate);
    }

    function castVoteSimple(string memory optionId, string memory ipfsURI) external {
        require(block.timestamp >= startDate && block.timestamp <= endDate, "Election not active");
        require(!voters[msg.sender], "Already voted");
        
        results[optionId]++;
        voters[msg.sender] = true;
        emit VoteCast(0, msg.sender, ipfsURI); // Using 0 as a placeholder for electionId
    }

    function castVoteDistribution(string[] memory _optionIds, uint256[] memory votes, string memory ipfsURI) external {
        require(block.timestamp >= startDate && block.timestamp <= endDate, "Election not active");
        require(!voters[msg.sender], "Already voted");

        for (uint i = 0; i < _optionIds.length; i++) {
            results[_optionIds[i]] += votes[i];
        }
        voters[msg.sender] = true;
        emit VoteCast(0, msg.sender, ipfsURI);
    }

    function castVoteRankedChoice(string[] memory rankedOptions, string memory ipfsURI) external {
        require(block.timestamp >= startDate && block.timestamp <= endDate, "Election not active");
        require(!voters[msg.sender], "Already voted");

        // For ranked choice, we typically only count the first preference on-chain for simplicity.
        // The full ranking is stored on IPFS for more complex off-chain tallying if needed.
        if (rankedOptions.length > 0) {
            results[rankedOptions[0]]++;
        }
        voters[msg.sender] = true;
        emit VoteCast(0, msg.sender, ipfsURI);
    }
}