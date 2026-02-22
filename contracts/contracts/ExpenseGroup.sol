// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExpenseGroup {
    address public creator;
    string public groupName;
    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => int256) public balances;

    struct Expense {
        uint256 id;
        address paidBy;
        uint256 totalAmount;
        string description;
        uint256 timestamp;
    }

    Expense[] public expenses;
    uint256 public expenseCount;

    event ExpenseAdded(uint256 indexed id, address indexed paidBy, uint256 totalAmount, string description);
    event DebtSettled(address indexed from, address indexed to, uint256 amount);

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }

    constructor(string memory _name, address[] memory _members, address _creator) {
        creator = _creator;
        groupName = _name;

        // Always add creator first
        members.push(_creator);
        isMember[_creator] = true;

        for (uint256 i = 0; i < _members.length; i++) {
            require(_members[i] != address(0), "Invalid member address");
            if (!isMember[_members[i]]) {
                members.push(_members[i]);
                isMember[_members[i]] = true;
            }
        }
    }

    function addExpense(uint256 _amount, string calldata _description) external onlyMember {
        require(_amount > 0, "Amount must be greater than 0");

        uint256 memberCount = members.length;
        uint256 share = _amount / memberCount;

        balances[msg.sender] += int256(_amount);

        for (uint256 i = 0; i < memberCount; i++) {
            balances[members[i]] -= int256(share);
        }

        expenses.push(Expense({
            id: expenseCount,
            paidBy: msg.sender,
            totalAmount: _amount,
            description: _description,
            timestamp: block.timestamp
        }));

        expenseCount++;

        emit ExpenseAdded(expenseCount - 1, msg.sender, _amount, _description);
    }

    function settleDebt(address _creditor) external payable onlyMember {
        require(isMember[_creditor], "Creditor is not a member");
        require(msg.value > 0, "Must send ETH to settle");

        balances[msg.sender] += int256(msg.value);
        balances[_creditor] -= int256(msg.value);

        (bool success, ) = payable(_creditor).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit DebtSettled(msg.sender, _creditor, msg.value);
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getBalances() external view returns (address[] memory, int256[] memory) {
        int256[] memory balanceValues = new int256[](members.length);
        for (uint256 i = 0; i < members.length; i++) {
            balanceValues[i] = balances[members[i]];
        }
        return (members, balanceValues);
    }

    function getAllExpenses() external view returns (Expense[] memory) {
        return expenses;
    }
}
