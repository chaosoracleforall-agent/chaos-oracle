import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const isTestnet = network === "baseSepolia" || network === "hardhat" || network === "localhost";

  console.log("=".repeat(60));
  console.log(`Deploying PredictionMarketFactoryV3 to ${network}`);
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // ---- Addresses ----
  let CREATOR_WALLET, AGENT_WALLET, CHAOS_TOKEN, AERODROME_ROUTER, WETH;

  if (isTestnet) {
    // ---- TESTNET CONFIG ----
    // On testnet, deployer acts as both creator and agent
    CREATOR_WALLET = deployer.address;
    AGENT_WALLET = deployer.address;

    // Deploy a mock CHAOS token (uses existing mocks/MockERC20.sol)
    console.log("Deploying MockERC20 as CHAOS token on testnet...");
    const MockERC20 = await hre.ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    const mockChaos = await MockERC20.deploy(
      "Chaos Token (Testnet)",
      "tCHAOS",
      18
    );
    await mockChaos.waitForDeployment();
    CHAOS_TOKEN = await mockChaos.getAddress();

    // Mint 1M tCHAOS to deployer
    const mintTx = await mockChaos.mint(deployer.address, hre.ethers.parseEther("1000000"));
    await mintTx.wait();
    console.log("MockCHAOS deployed to:", CHAOS_TOKEN);
    console.log("Minted 1,000,000 tCHAOS to deployer");
    console.log();

    // Aerodrome doesn't exist on Sepolia — use zero address (buy-and-burn skipped)
    AERODROME_ROUTER = hre.ethers.ZeroAddress;

    // WETH on Base Sepolia (same canonical address)
    WETH = "0x4200000000000000000000000000000000000006";
  } else {
    // ---- MAINNET CONFIG ----
    CREATOR_WALLET = "0x398bA4b1b82be8FdACdAbeB163584C7376b023B8";
    AGENT_WALLET = "0x46B268e9C57083F9c6aDd793995214E1503B7275";
    CHAOS_TOKEN = "0xA1864203355AeFAd58c051aC984672a6585C77C9";
    AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
    WETH = "0x4200000000000000000000000000000000000006";
  }

  console.log("Configuration:");
  console.log("  Creator Wallet: ", CREATOR_WALLET);
  console.log("  Agent Wallet:   ", AGENT_WALLET);
  console.log("  CHAOS Token:    ", CHAOS_TOKEN);
  console.log("  Aerodrome Router:", AERODROME_ROUTER);
  console.log("  WETH:           ", WETH);
  console.log();

  // ---- Deploy V3 Factory ----
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
  if (network !== "hardhat" && network !== "localhost") {
    console.log("Waiting 30s for block confirmations before verification...");
    await new Promise(r => setTimeout(r, 30000));

    // Verify MockERC20 if testnet
    if (isTestnet) {
      try {
        await hre.run("verify:verify", {
          address: CHAOS_TOKEN,
          constructorArguments: [
            "Chaos Token (Testnet)",
            "tCHAOS",
            18
          ],
        });
        console.log("MockCHAOS verified on BaseScan.");
      } catch (err) {
        console.log("MockCHAOS verification failed:", err.message);
      }
    }

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
      console.log("PredictionMarketFactoryV3 verified on BaseScan.");
    } catch (err) {
      console.log("V3 verification failed (may already be verified):", err.message);
    }
  }

  // ---- Summary ----
  console.log();
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:              ", network);
  if (isTestnet) {
    console.log("MockCHAOS Token:      ", CHAOS_TOKEN);
  }
  console.log("PredictionMarketV3:   ", address);
  console.log("Creator Wallet:       ", CREATOR_WALLET);
  console.log("Agent Wallet:         ", AGENT_WALLET);
  console.log("CHAOS Token:          ", CHAOS_TOKEN);
  console.log("Aerodrome Router:     ", AERODROME_ROUTER, isTestnet ? "(zero — buy-and-burn disabled)" : "");
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
  if (network !== "hardhat" && network !== "localhost") {
    console.log("Manual verification command (if auto-verify failed):");
    console.log(`npx hardhat verify --network ${network} ${address} ${CREATOR_WALLET} ${AGENT_WALLET} ${CHAOS_TOKEN} ${AERODROME_ROUTER} ${WETH}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
