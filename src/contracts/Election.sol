// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Election
 * @dev Contract to manage the state and logic of a single election.
 * This contract is intended to be deployed by the ElectionFactory.
 */
contract Election {
    // --- Enums ---
    enum Status { Upcoming, Active, Ended }
    enum ElectionType { SimpleMajority, Quadratic, RankedChoice, Cumulative }

    // --- State Variables ---
    address public immutable creator;
    Status public status;
    ElectionType public immutable electionType;
    uint256 public immutable endDate;
    string public immutable metadataURI; // IPFS URI for title, description, options

    mapping(string => uint64) public results;
    mapping(address => bool) public voters;
    uint256 public totalVoters;

    // --- Events ---
    event VoteCasted(address indexed voter, ElectionType voteType);
    event ElectionEnded(uint256 timestamp);

    // --- Modifiers ---
    modifier onlyActive() {
        require(status == Status.Active, "Election is not active");
        require(block.timestamp < endDate, "Election has ended");
        _;
    }

    modifier notVoted() {
        require(!voters[msg.sender], "Already voted");
        _;
    }

    /**
     * @dev Sets the initial values for the election.
     * @param _creator The address of the election creator.
     * @param _endDate The timestamp when the election ends.
     * @param _electionType The voting mechanism for this election.
     * @param _metadataURI The IPFS URI containing election details.
     * @param _optionIds An array of string identifiers for each votable option.
     */
    constructor(
        address _creator,
        uint256 _endDate,
        ElectionType _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) {
        creator = _creator;
        endDate = _endDate;
        electionType = _electionType;
        metadataURI = _metadataURI;
        status = block.timestamp >= _endDate ? Status.Ended : Status.Active;

        // Initialize results for all options to 0
        for (uint i = 0; i < _optionIds.length; i++) {
            results[_optionIds[i]] = 0;
        }
    }

    // --- Voting Functions ---

    /**
     * @dev Casts a vote in a Simple Majority election.
     * @param _optionId The identifier of the chosen option.
     * @param _voteDataURI The IPFS URI of the VoteData JSON.
     */
    function castVoteSimple(string memory _optionId, string memory _voteDataURI) external onlyActive notVoted {
        require(electionType == ElectionType.SimpleMajority, "Invalid election type");
        // _voteDataURI is stored off-chain, linked to the transaction hash for record-keeping.
        // The contract acts on the data passed directly.
        results[_optionId] += 1;
        _recordVote();
        emit VoteCasted(msg.sender, ElectionType.SimpleMajority);
    }

    /**
     * @dev Casts votes in a Quadratic or Cumulative election.
     * @param _optionIds Array of option identifiers being voted for.
     * @param _votes Array of votes corresponding to each option.
     * @param _voteDataURI The IPFS URI of the VoteData JSON.
     */
    function castVoteDistribution(string[] memory _optionIds, uint64[] memory _votes, string memory _voteDataURI) external onlyActive notVoted {
        require(electionType == ElectionType.Quadratic || electionType == ElectionType.Cumulative, "Invalid election type");
        require(_optionIds.length == _votes.length, "Input array length mismatch");

        if (electionType == ElectionType.Quadratic) {
            uint64 totalCredits = 0;
            for (uint i = 0; i < _votes.length; i++) {
                totalCredits += _votes[i] * _votes[i];
            }
            require(totalCredits <= 100, "Exceeds 100 vote credits"); // Assuming 100 credits for quadratic
        } else { // Cumulative
            uint64 totalVotes = 0;
            for (uint i = 0; i < _votes.length; i++) {
                totalVotes += _votes[i];
            }
            require(totalVotes <= 10, "Exceeds 10 votes"); // Assuming 10 votes for cumulative
        }

        for (uint i = 0; i < _optionIds.length; i++) {
            results[_optionIds[i]] += _votes[i];
        }
        _recordVote();
        emit VoteCasted(msg.sender, electionType);
    }

    /**
     * @dev Casts a vote in a Ranked-Choice election.
     * @param _rankedOptionIds Array of option identifiers in order of preference.
     * @param _voteDataURI The IPFS URI of the VoteData JSON.
     */
    function castVoteRankedChoice(string[] memory _rankedOptionIds, string memory _voteDataURI) external onlyActive notVoted {
        require(electionType == ElectionType.RankedChoice, "Invalid election type");
        // For simplicity, on-chain tally only tracks first-preference votes.
        // Full runoff calculation would be done off-chain by reading all VoteData from IPFS.
        if (_rankedOptionIds.length > 0) {
            results[_rankedOptionIds[0]] += 1;
        }
        _recordVote();
        emit VoteCasted(msg.sender, ElectionType.RankedChoice);
    }

    // --- State-Changing Functions ---

    /**
     * @dev Closes the election if the end date has passed.
     */
    function closeElection() external {
        require(block.timestamp >= endDate, "Election not yet ended");
        require(status == Status.Active, "Election already closed");
        status = Status.Ended;
        emit ElectionEnded(block.timestamp);
    }

    // --- Internal Functions ---

    /**
     * @dev Internal helper to mark a user as voted and increment voter count.
     */
    function _recordVote() internal {
        voters[msg.sender] = true;
        totalVoters++;
    }

    // --- View Functions ---

    /**
     * @dev Returns the core details of the election.
     */
    function getElectionDetails() external view returns (
        address,
        Status,
        ElectionType,
        uint256,
        string memory,
        uint256
    ) {
        return (
            creator,
            status,
            electionType,
            endDate,
            metadataURI,
            totalVoters
        );
    }
}