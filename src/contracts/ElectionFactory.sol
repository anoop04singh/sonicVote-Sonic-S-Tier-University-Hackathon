// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Election.sol";

contract ElectionFactory {
    address[] public deployedElections;

    event ElectionCreated(address indexed electionAddress, address indexed creator);

    function createElection(
        uint256 _startDate,
        uint256 _endDate,
        Election.ElectionType _electionType,
        string memory _metadataURI,
        string[] memory _optionIds
    ) external {
        Election newElection = new Election(
            msg.sender,
            _startDate,
            _endDate,
            _electionType,
            _metadataURI,
            _optionIds
        );
        deployedElections.push(address(newElection));
        emit ElectionCreated(address(newElection), msg.sender);
    }

    function getDeployedElections() external view returns (address[] memory) {
        return deployedElections;
    }
}