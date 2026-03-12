import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying PredictionMarketFactoryV2 with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const CREATOR_WALLET = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";
  const AGENT_WALLET = "0x46B268e9C57083F9c6aDd793995214E1503B7275";
  const CHAOS_TOKEN = "0xA1864203355AeFAd58c051aC984672a6585C77C9";
  const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
  const WETH = "0x4200000000000000000000000000000000000006";

  const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
  const factory = await Factory.deploy(
    CREATOR_WALLET,
    AGENT_WALLET,
    CHAOS_TOKEN,
    AERODROME_ROUTER,
    WETH
  );

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("PredictionMarketFactoryV2 deployed to:", address);
  console.log("\nNEXT STEPS:");
  console.log("1. Update CONTRACT_ADDRESS in chaos-oracle/app/page.tsx");
  console.log("2. Update CONTRACT_ADDRESS in chaos-oracle/app/ClientComponents.tsx");
  console.log("3. Update CONTRACT_ADDRESS in agent-node/.env");
  console.log("4. Verify on BaseScan: npx hardhat verify --network base", address,
    CREATOR_WALLET, AGENT_WALLET, CHAOS_TOKEN, AERODROME_ROUTER, WETH);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
