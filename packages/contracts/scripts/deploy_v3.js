import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Deploying PredictionMarketFactoryV3 to Base Sepolia");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // ---- Addresses ----
  // Creator wallet (protocol revenue recipient)
  const CREATOR_WALLET = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";

  // Agent wallet (can be updated post-deploy via updateAgentWallet)
  const AGENT_WALLET = "0x46B268e9C57083F9c6aDd793995214E1503B7275";

  // CHAOS token on Base mainnet (use same address for testnet or deploy a mock)
  const CHAOS_TOKEN = "0xA1864203355AeFAd58c051aC984672a6585C77C9";

  // Aerodrome router on Base
  const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

  // WETH on Base
  const WETH = "0x4200000000000000000000000000000000000006";

  console.log("Configuration:");
  console.log("  Creator Wallet: ", CREATOR_WALLET);
  console.log("  Agent Wallet:   ", AGENT_WALLET);
  console.log("  CHAOS Token:    ", CHAOS_TOKEN);
  console.log("  Aerodrome Router:", AERODROME_ROUTER);
  console.log("  WETH:           ", WETH);
  console.log();

  // ---- Deploy ----
  const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV3");
  const factory = await Factory.deploy(
    CREATOR_WALLET,
    AGENT_WALLET,
    CHAOS_TOKEN,
    AERODROME_ROUTER,
    WETH
  );

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("PredictionMarketFactoryV3 deployed to:", address);
  console.log();

  // ---- Verify on BaseScan ----
  console.log("Waiting 30s for block confirmations before verification...");
  await new Promise(r => setTimeout(r, 30000));

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [
        CREATOR_WALLET,
        AGENT_WALLET,
        CHAOS_TOKEN,
        AERODROME_ROUTER,
        WETH
      ],
    });
    console.log("Contract verified on BaseScan.");
  } catch (err) {
    console.log("Verification failed (may already be verified):", err.message);
  }

  // ---- Summary ----
  console.log();
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:              Base Sepolia (testnet)");
  console.log("PredictionMarketV3:   ", address);
  console.log("Creator Wallet:       ", CREATOR_WALLET);
  console.log("Agent Wallet:         ", AGENT_WALLET);
  console.log("CHAOS Token:          ", CHAOS_TOKEN);
  console.log("Aerodrome Router:     ", AERODROME_ROUTER);
  console.log("WETH:                 ", WETH);
  console.log();
  console.log("NEXT STEPS:");
  console.log("1. Update CONTRACT_ADDRESS in chaos-oracle/packages/frontend/app/page.tsx");
  console.log("2. Update CONTRACT_ADDRESS in chaos-oracle/packages/frontend/app/ClientComponents.tsx");
  console.log("3. Update CONTRACT_ADDRESS in chaos-oracle/packages/agent/.env");
  console.log("4. Transfer ownership if deployer != intended owner");
  console.log("5. Optionally enable CHAOS gate: toggleChaosGate()");
  console.log("6. Optionally adjust fees: updateFeeConfig(burnBps, creatorBps, agentBps)");
  console.log();
  console.log("Manual verification command (if auto-verify failed):");
  console.log(`npx hardhat verify --network baseSepolia ${address} ${CREATOR_WALLET} ${AGENT_WALLET} ${CHAOS_TOKEN} ${AERODROME_ROUTER} ${WETH}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
