const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy Factory
  const Factory = await hre.ethers.getContractFactory("ExpenseGroupFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("ExpenseGroupFactory deployed to:", factoryAddress);

  // Create a test group — creator (deployer) is auto-added by contract
  // Only pass additional members here
  const members = process.env.METAMASK_ADDRESS
    ? [process.env.METAMASK_ADDRESS]
    : [];
  console.log("Creator:", deployer.address);
  console.log("Additional members:", members);
  const tx = await factory.createGroup("Test Group", members);
  const receipt = await tx.wait();

  // Get group address from event
  const event = receipt.logs.find((log) => {
    try {
      return factory.interface.parseLog(log)?.name === "GroupCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = factory.interface.parseLog(event);
  const groupAddress = parsedEvent.args.groupAddress;
  console.log("Test ExpenseGroup deployed to:", groupAddress);

  console.log("\n--- Add to .env.local ---");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_TEST_GROUP_ADDRESS=${groupAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
