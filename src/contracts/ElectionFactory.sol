// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Election.sol";

/**
 * @title ElectionFactory
 * @author 0xanoop
 * @dev A factory contract for creating and tracking new Election contracts.
 * This allows for a decentralized way to deploy and discover elections.
 */
contract ElectionFactory {
    // An array to store the addresses of all created Election contracts.
    address[] public deployedElections;

    // Event emitted whenever a new election is successfully created.
    event ElectionCreated(address indexed electionAddress, address indexed creator);

    /**
     * @dev Creates and deploys a new Election contract.
     * @param _startDate The Unix timestamp for when the election should start.
     * @param _endDate The Unix timestamp for when the election should end.
     * @param _electionType The type of voting mechanism for the new election.
     * @param _metadataURI The IPFS URI for the election's metadata.
     * @param _optionIds An array of strings for the votable options.
     */
    function createElection(
        uint256 _startDate,
        uint256 _endDate,
        Election.ElectionType _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) external {
        // Create a new instance of the Election contract.
        Election newElection = new Election(
            msg.sender,
            _startDate,
            _endDate,
            _electionType,
            _metadataURI,
            _optionIds
        );
        // Store the address of the newly created contract.
        deployedElections.push(address(newElection));
        // Emit an event to notify listeners of the new election.
        emit ElectionCreated(address(newElection), msg.sender);
    }

    /**
     * @dev Retrieves a list of all election addresses created by this factory.
     * @return An array of addresses for all deployed Election contracts.
     */
    function getDeployedElections() external view returns (address[] memory) {
        return deployedElections;
    }
}