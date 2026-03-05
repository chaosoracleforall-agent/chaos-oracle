const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("[DEPLOYER] Activating Oracle Engine with account:", deployer.address);

  // Deployment Parameters from Secure Vault
  const creatorWallet = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";
  const agentWallet = "0x6a2A797CB5736252E44B81965aa7fcF7f43F4103";
  const aerodromeRouter = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
  const weth = "0x4200000000000000000000000000000000000006";

  const Factory = await hre.ethers.getContractFactory("PredictionMarketFactory");
  
  console.log("[DEPLOYER] Deploying Audited PredictionMarketFactory to Base Mainnet...");
  const factory = await Factory.deploy(
    creatorWallet,
    agentWallet,
    aerodromeRouter,
    weth
  );

  await factory.deployed();

  console.log("--------------------------------------------------");
  console.log("CHAOS ORACLE ENGINE DEPLOYED");
  console.log("Contract Address:", factory.address);
  console.log("Creator (9%):", creatorWallet);
  console.log("Agent (1%):", agentWallet);
  console.log("Burn Target (90%): $CHAOS (0xA1864203...C77C9)");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
