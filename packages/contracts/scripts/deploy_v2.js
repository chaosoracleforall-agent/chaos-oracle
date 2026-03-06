import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("[DEPLOYER] Account:", deployer.address);
  console.log("[DEPLOYER] Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Base Mainnet addresses
  const creatorWallet = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";
  const agentWallet = "0x6a2A797CB5736252E44B81965aa7fcF7f43F4103";
  const chaosToken = "0xA1864203355AeFAd58c051aC984672a6585C77C9";
  const aerodromeRouter = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
  const weth = "0x4200000000000000000000000000000000000006";

  console.log("\n[DEPLOYER] Deploying PredictionMarketFactoryV2...");
  const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
  const factory = await Factory.deploy(creatorWallet, agentWallet, chaosToken, aerodromeRouter, weth);
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("\n══════════════════════════════════════════");
  console.log("  CHAOS ORACLE V2 DEPLOYED");
  console.log("══════════════════════════════════════════");
  console.log("  Contract:", address);
  console.log("  Creator (9%):", creatorWallet);
  console.log("  Agent (1%):", agentWallet);
  console.log("  CHAOS Token:", chaosToken);
  console.log("  Aerodrome Router:", aerodromeRouter);
  console.log("  WETH:", weth);
  console.log("══════════════════════════════════════════");

  // Verify on BaseScan
  if (hre.network.name === "base") {
    console.log("\n[DEPLOYER] Waiting 30s for block confirmations before verification...");
    await new Promise(r => setTimeout(r, 30000));

    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [creatorWallet, agentWallet, chaosToken, aerodromeRouter, weth],
      });
      console.log("[DEPLOYER] Contract verified on BaseScan!");
    } catch (e) {
      console.error("[DEPLOYER] Verification failed:", e.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
