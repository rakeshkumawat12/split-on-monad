// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ExpenseGroup.sol";

contract ExpenseGroupFactory {
    mapping(address => address[]) public userGroups;

    event GroupCreated(address indexed groupAddress, string name, address indexed creator);

    function createGroup(string calldata _name, address[] calldata _members) external returns (address) {
        ExpenseGroup group = new ExpenseGroup(_name, _members, msg.sender);
        address groupAddress = address(group);

        // Always register for creator first
        userGroups[msg.sender].push(groupAddress);

        // Register for other members (skip if same as creator)
        for (uint256 i = 0; i < _members.length; i++) {
            if (_members[i] != msg.sender) {
                userGroups[_members[i]].push(groupAddress);
            }
        }

        emit GroupCreated(groupAddress, _name, msg.sender);
        return groupAddress;
    }

    function getUserGroups(address _user) external view returns (address[] memory) {
        return userGroups[_user];
    }
}
