const { expect } = require("chai");
const hre = require("hardhat");

describe("ExpenseGroup", function () {
  let factory, group, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    const Factory = await hre.ethers.getContractFactory("ExpenseGroupFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    const tx = await factory.createGroup("Test Group", [
      owner.address,
      addr1.address,
      addr2.address,
    ]);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log) => {
      try {
        return factory.interface.parseLog(log)?.name === "GroupCreated";
      } catch {
        return false;
      }
    });
    const parsedEvent = factory.interface.parseLog(event);
    const groupAddress = parsedEvent.args.groupAddress;

    group = await hre.ethers.getContractAt("ExpenseGroup", groupAddress);
  });

  it("should create group with correct members", async function () {
    const members = await group.getMembers();
    expect(members.length).to.equal(3);
    expect(members).to.include(owner.address);
    expect(members).to.include(addr1.address);
    expect(members).to.include(addr2.address);
  });

  it("should have correct group name", async function () {
    expect(await group.groupName()).to.equal("Test Group");
  });

  it("should add expense and split equally", async function () {
    const amount = hre.ethers.parseEther("0.3");
    await group.addExpense(amount, "Dinner");

    const [members, balances] = await group.getBalances();
    // Owner paid 0.3 ETH, split 3 ways = 0.1 each
    // Owner balance: +0.3 - 0.1 = +0.2
    const ownerIdx = members.indexOf(owner.address);
    expect(balances[ownerIdx]).to.equal(hre.ethers.parseEther("0.2"));

    // Others: -0.1 each
    const addr1Idx = members.indexOf(addr1.address);
    expect(balances[addr1Idx]).to.equal(-hre.ethers.parseEther("0.1"));
  });

  it("should record expense details", async function () {
    const amount = hre.ethers.parseEther("0.3");
    await group.addExpense(amount, "Dinner");

    const expenses = await group.getAllExpenses();
    expect(expenses.length).to.equal(1);
    expect(expenses[0].paidBy).to.equal(owner.address);
    expect(expenses[0].totalAmount).to.equal(amount);
    expect(expenses[0].description).to.equal("Dinner");
  });

  it("should not allow non-members to add expense", async function () {
    const [, , , nonMember] = await hre.ethers.getSigners();
    const amount = hre.ethers.parseEther("0.1");
    await expect(
      group.connect(nonMember).addExpense(amount, "Test")
    ).to.be.revertedWith("Not a member");
  });
});
