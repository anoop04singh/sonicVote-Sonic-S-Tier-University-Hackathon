// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Election
 * @author 0xanoop
 * @dev A contract to manage a single decentralized election.
 * It handles the election's lifecycle, vote casting, and result tallying.
 */
contract Election {
    // Enum to represent the possible states of an election.
    enum Status { Upcoming, Active, Ended }
    // Enum to define the voting mechanism used in the election.
    enum ElectionType { SimpleMajority, Quadratic, RankedChoice, Cumulative }

    // EVENTS
    event VoteCast(address indexed voter, string ipfsURI);

    // --- State Variables ---

    address public immutable creator;          // The address that created the election.
    uint256 public immutable startDate;        // Timestamp when the election becomes active.
    uint256 public immutable endDate;          // Timestamp when the election ends.
    ElectionType public immutable electionType; // The voting mechanism for this election.
    string public metadataURI;       // IPFS URI pointing to the election's metadata (title, description, options).

    mapping(string => uint256) public results; // Maps an option ID (e.g., "Option A") to its vote count.
    mapping(address => bool) public voters;    // Maps a voter's address to a boolean indicating if they have voted.
    uint256 public totalVoters;                // The total number of unique voters who have participated.

    /**
     * @dev Sets up the election with its core, immutable properties.
     * @param _creator The address of the election creator.
     * @param _startDate The Unix timestamp for when the election should start.
     * @param _endDate The Unix timestamp for when the election should end.
     * @param _electionType The type of voting mechanism to be used.
     * @param _metadataURI The IPFS URI for the election's off-chain metadata.
     * @param _optionIds An array of strings representing the unique identifiers for each voting option.
     */
    constructor(
        address _creator,
        uint256 _startDate,
        uint256 _endDate,
        ElectionType _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) {
        require(_startDate < _endDate, "Start date must be before end date");
        require(block.timestamp < _endDate, "End date must be in the future");

        creator = _creator;
        startDate = _startDate;
        endDate = _endDate;
        electionType = _electionType;
        metadataURI = _metadataURI;

        // Initialize results for all options to 0 to ensure they exist in the mapping.
        for (uint i = 0; i < _optionIds.length; i++) {
            results[_optionIds[i]] = 0;
        }
    }

    /**
     * @dev Determines the current status of the election based on the current time.
     * @return The current status (Upcoming, Active, or Ended).
     */
    function getStatus() public view returns (Status) {
        if (block.timestamp < startDate) {
            return Status.Upcoming;
        } else if (block.timestamp >= startDate && block.timestamp < endDate) {
            return Status.Active;
        } else {
            return Status.Ended;
        }
    }

    /**
     * @dev Casts a single vote in a Simple Majority election.
     * @param _optionId The identifier of the option being voted for.
     * @param _voteURI A placeholder for a potential IPFS URI for vote receipt/data.
     */
    function castVoteSimple(string memory _optionId, string memory _voteURI) external {
        require(getStatus() == Status.Active, "Election is not active");
        require(!voters[msg.sender], "Already voted");
        require(electionType == ElectionType.SimpleMajority, "Invalid vote type");

        voters[msg.sender] = true;
        results[_optionId] += 1;
        totalVoters += 1;
        emit VoteCast(msg.sender, _voteURI);
    }

    /**
     * @dev Casts multiple votes in a Quadratic or Cumulative election.
     * @param _optionIds An array of option identifiers.
     * @param _votes An array of votes corresponding to each option ID.
     * @param _voteURI A placeholder for a potential IPFS URI for vote receipt/data.
     */
    function castVoteDistribution(string[] memory _optionIds, uint256[] memory _votes, string memory _voteURI) external {
        require(getStatus() == Status.Active, "Election is not active");
        require(!voters[msg.sender], "Already voted");
        require(electionType == ElectionType.Quadratic || electionType == ElectionType.Cumulative, "Invalid vote type");
        require(_optionIds.length == _votes.length, "Input array mismatch");

        voters[msg.sender] = true;
        for (uint i = 0; i < _optionIds.length; i++) {
            if (_votes[i] > 0) {
                results[_optionIds[i]] += _votes[i];
            }
        }
        totalVoters += 1;
        emit VoteCast(msg.sender, _voteURI);
    }

    /**
     * @dev Casts a ranked-choice vote. Only the first preference is tallied on-chain.
     * @param _rankedOptionIds An array of option identifiers, ordered by preference.
     * @param _voteURI A placeholder for a potential IPFS URI for vote receipt/data.
     */
    function castVoteRankedChoice(string[] memory _rankedOptionIds, string memory _voteURI) external {
        require(getStatus() == Status.Active, "Election is not active");
        require(!voters[msg.sender], "Already voted");
        require(electionType == ElectionType.RankedChoice, "Invalid vote type");
        require(_rankedOptionIds.length > 0, "Must rank at least one option");

        voters[msg.sender] = true;
        // For simplicity, on-chain tallying only considers the first preference.
        results[_rankedOptionIds[0]] += 1;
        totalVoters += 1;
        emit VoteCast(msg.sender, _voteURI);
    }

    /**
     * @dev Retrieves the key details of the election.
     * @return A tuple containing the creator, status, type, end date, metadata URI, total voters, and start date.
     */
    function getElectionDetails() public view returns (
        address,
        Status,
        ElectionType,
        uint256,
        string memory,
        uint256,
        uint256
    ) {
        return (
            creator,
            getStatus(),
            electionType,
            endDate,
            metadataURI,
            totalVoters,
            startDate
        );
    }
}