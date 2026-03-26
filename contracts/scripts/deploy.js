const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "RBTC");

  // ── Protocol addresses on RSK Testnet ──
  // Replace these with the actual deployed addresses of each protocol
  const TROPYKUS    = process.env.TROPYKUS_ADDRESS    || "0x0000000000000000000000000000000000000001";
  const SOVRYN      = process.env.SOVRYN_ADDRESS      || "0x0000000000000000000000000000000000000002";
  const MONEY_ON_CHAIN = process.env.MOC_ADDRESS      || "0x0000000000000000000000000000000000000003";

  console.log("\nProtocol targets:");
  console.log("  Tropykus:    ", TROPYKUS);
  console.log("  Sovryn:      ", SOVRYN);
  console.log("  MoneyOnChain:", MONEY_ON_CHAIN);

  const YieldRouter = await hre.ethers.getContractFactory("YieldRouter");
  const router = await YieldRouter.deploy(TROPYKUS, SOVRYN, MONEY_ON_CHAIN);
  await router.waitForDeployment();

  const address = await router.getAddress();

  console.log("\n✔ YieldRouter deployed to:", address);

  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  const explorer =
    chainId === 31n
      ? `https://explorer.testnet.rsk.co/address/${address}`
      : `https://explorer.rsk.co/address/${address}`;

  console.log("  Explorer:", explorer);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
