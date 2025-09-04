// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Election.sol";

/**
 * @title ElectionFactory
 * @dev Deploys and keeps track of Election contracts.
 */
contract ElectionFactory {
    address[] public deployedElections;

    event ElectionCreated(
        address indexed electionAddress,
        address indexed creator,
        uint256 endDate,
        Election.ElectionType electionType
    );

    /**
     * @dev Creates and deploys a new Election contract.
     * @param _endDate The timestamp when the election ends.
     * @param _electionType The voting mechanism for the new election.
     * @param _metadataURI The IPFS URI containing election details.
     * @param _optionIds An array of string identifiers for each votable option.
     */
    function createElection(
        uint256 _endDate,
        Election.ElectionType _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) external {
        require(_endDate > block.timestamp, "End date must be in the future");
        require(_optionIds.length >= 2, "Must have at least two options");

        Election newElection = new Election(
            msg.sender,
            _endDate,
            _electionType,
            _metadataURI,
            _optionIds
        );

        deployedElections.push(address(newElection));

        emit ElectionCreated(
            address(newElection),
            msg.sender,
            _endDate,
            _electionType
        );
    }

    /**
     * @dev Returns an array of all deployed election contract addresses.
     */
    function getDeployedElections() external view returns (address[] memory) {
        return deployedElections;
    }
}