import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const CREATOR_WALLET = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";
  const AGENT_WALLET = "0x6a2A797CB5736252E44B81965aa7fcF7f43F4103";
  const CHAOS_TOKEN = "0xA1864203355AeFAd58c051aC984672a6585C77C9"; // Virtuals token
  const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
  const WETH = "0x4200000000000000000000000000000000000006";

  const Factory = await hre.ethers.getContractFactory("PredictionMarketFactory");
  const factory = await Factory.deploy(
    CREATOR_WALLET,
    AGENT_WALLET,
    CHAOS_TOKEN,
    AERODROME_ROUTER,
    WETH
  );

  await factory.waitForDeployment();

  console.log("PredictionMarketFactory deployed to:", await factory.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
