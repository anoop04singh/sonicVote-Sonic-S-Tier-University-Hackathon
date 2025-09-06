// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Election {
    enum Status { Upcoming, Active, Ended }
    enum ElectionType { SimpleMajority, Quadratic, RankedChoice, Cumulative }

    address public immutable creator;
    uint256 public immutable startDate;
    uint256 public immutable endDate;
    ElectionType public immutable electionType;
    string public immutable metadataURI;

    mapping(string => uint256) public results;
    mapping(address => bool) public voters;
    uint256 public totalVoters;

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

        // Initialize results for all options to 0
        for (uint i = 0; i < _optionIds.length; i++) {
            results[_optionIds[i]] = 0;
        }
    }

    function getStatus() public view returns (Status) {
        if (block.timestamp < startDate) {
            return Status.Upcoming;
        } else if (block.timestamp >= startDate && block.timestamp < endDate) {
            return Status.Active;
        } else {
            return Status.Ended;
        }
    }

    function castVoteSimple(string memory _optionId, string memory /*_voteURI*/) external {
        require(getStatus() == Status.Active, "Election is not active");
        require(!voters[msg.sender], "Already voted");
        require(electionType == ElectionType.SimpleMajority, "Invalid vote type");

        voters[msg.sender] = true;
        results[_optionId] += 1;
        totalVoters += 1;
    }

    function castVoteDistribution(string[] memory _optionIds, uint256[] memory _votes, string memory /*_voteURI*/) external {
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
    }

    function castVoteRankedChoice(string[] memory _rankedOptionIds, string memory /*_voteURI*/) external {
        require(getStatus() == Status.Active, "Election is not active");
        require(!voters[msg.sender], "Already voted");
        require(electionType == ElectionType.RankedChoice, "Invalid vote type");
        require(_rankedOptionIds.length > 0, "Must rank at least one option");

        voters[msg.sender] = true;
        results[_rankedOptionIds[0]] += 1;
        totalVoters += 1;
    }

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