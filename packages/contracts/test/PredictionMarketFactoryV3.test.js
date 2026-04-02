import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PredictionMarketFactoryV3", function () {
  let factory, mockChaos, owner, agent, user1, user2, user3;
  const AERODROME_ROUTER = hre.ethers.ZeroAddress; // Mock to avoid real swap
  const WETH = hre.ethers.ZeroAddress;
  const STANDARD_FEE = hre.ethers.parseEther("0.001");
  const FEATURED_FEE = hre.ethers.parseEther("0.01");
  const ONE_DAY = 86400;
  const SEVEN_DAYS = 7 * ONE_DAY;

  async function futureDeadline(offsetSeconds = ONE_DAY) {
    const latest = await time.latest();
    return latest + offsetSeconds;
  }

  beforeEach(async function () {
    [owner, agent, user1, user2, user3] = await hre.ethers.getSigners();

    // Deploy a minimal ERC20 mock for CHAOS token gate tests
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    mockChaos = await MockERC20.deploy("Chaos Token", "CHAOS", 18);

    const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV3");
    factory = await Factory.deploy(
      owner.address,
      agent.address,
      await mockChaos.getAddress(),
      AERODROME_ROUTER,
      WETH
    );
  });

  // ================================================================
  // DEPLOYMENT
  // ================================================================

  describe("Deployment", function () {
    it("should set addresses correctly", async function () {
      expect(await factory.CREATOR_WALLET()).to.equal(owner.address);
      expect(await factory.agentWallet()).to.equal(agent.address);
      expect(await factory.AERODROME_ROUTER()).to.equal(AERODROME_ROUTER);
    });

    it("should set owner to deployer", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("should revert with zero address creator", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV3");
      await expect(
        Factory.deploy(hre.ethers.ZeroAddress, agent.address, await mockChaos.getAddress(), AERODROME_ROUTER, WETH)
      ).to.be.revertedWith("Invalid creator");
    });

    it("should revert with zero address agent", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV3");
      await expect(
        Factory.deploy(owner.address, hre.ethers.ZeroAddress, await mockChaos.getAddress(), AERODROME_ROUTER, WETH)
      ).to.be.revertedWith("Invalid agent");
    });

    it("should start unpaused", async function () {
      expect(await factory.paused()).to.be.false;
    });

    it("should start with chaos gate disabled", async function () {
      expect(await factory.chaosGateEnabled()).to.be.false;
    });

    it("should have default fee config", async function () {
      expect(await factory.burnBps()).to.equal(9000);
      expect(await factory.creatorBps()).to.equal(900);
      expect(await factory.agentBps()).to.equal(100);
    });
  });

  // ================================================================
  // AGENT WALLET UPDATE
  // ================================================================

  describe("Agent Wallet Update", function () {
    it("should allow owner to update agent wallet", async function () {
      await factory.connect(owner).updateAgentWallet(user1.address);
      expect(await factory.agentWallet()).to.equal(user1.address);
    });

    it("should emit AgentWalletUpdated event", async function () {
      await expect(factory.connect(owner).updateAgentWallet(user1.address))
        .to.emit(factory, "AgentWalletUpdated")
        .withArgs(agent.address, user1.address);
    });

    it("should revert if non-owner tries to update", async function () {
      await expect(
        factory.connect(user1).updateAgentWallet(user2.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should revert on zero address", async function () {
      await expect(
        factory.connect(owner).updateAgentWallet(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("should allow new agent to resolve after update", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      // Update agent to user3
      await factory.connect(owner).updateAgentWallet(user3.address);

      // Old agent should fail
      await time.increaseTo(deadline);
      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.revertedWith("Only Chaos Oracle can resolve");

      // New agent should succeed
      await factory.connect(user3).resolveMarket(0, true);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;
    });
  });

  // ================================================================
  // STANDARD MARKET CREATION
  // ================================================================

  describe("Standard Market Creation", function () {
    it("should create a market with deadline", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Will BTC hit 100k?", deadline, { value: STANDARD_FEE });
      const market = await factory.markets(0);
      expect(market.question).to.equal("Will BTC hit 100k?");
      expect(market.resolved).to.be.false;
      expect(market.creator).to.equal(user1.address);
      expect(market.deadline).to.equal(deadline);
      expect(market.featured).to.be.false;
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should revert without creation fee", async function () {
      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createMarket("Will BTC hit 100k?", deadline)
      ).to.be.revertedWith("Creation fee: 0.001 ETH");
    });

    it("should revert with past deadline", async function () {
      const latest = await time.latest();
      await expect(
        factory.connect(user1).createMarket("Test?", latest - 100, { value: STANDARD_FEE })
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("should emit MarketCreated event with featured=false", async function () {
      const deadline = await futureDeadline();
      await expect(factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE }))
        .to.emit(factory, "MarketCreated")
        .withArgs(0, "Test?", user1.address, deadline, false);
    });
  });

  // ================================================================
  // FEATURED MARKET CREATION
  // ================================================================

  describe("Featured Market Creation", function () {
    it("should create a featured market", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createFeaturedMarket("Premium Q?", deadline, { value: FEATURED_FEE });
      const market = await factory.markets(0);
      expect(market.featured).to.be.true;
      expect(market.question).to.equal("Premium Q?");
    });

    it("should revert with insufficient featured fee", async function () {
      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createFeaturedMarket("Test?", deadline, { value: STANDARD_FEE })
      ).to.be.revertedWith("Featured fee: 0.01 ETH");
    });

    it("should emit MarketCreated with featured=true", async function () {
      const deadline = await futureDeadline();
      await expect(factory.connect(user1).createFeaturedMarket("Featured?", deadline, { value: FEATURED_FEE }))
        .to.emit(factory, "MarketCreated")
        .withArgs(0, "Featured?", user1.address, deadline, true);
    });

    it("should return true from isFeatured view", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createFeaturedMarket("Featured?", deadline, { value: FEATURED_FEE });
      expect(await factory.isFeatured(0)).to.be.true;
    });

    it("should return false from isFeatured for standard market", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Standard?", deadline, { value: STANDARD_FEE });
      expect(await factory.isFeatured(0)).to.be.false;
    });
  });

  // ================================================================
  // CHAOS TOKEN GATE
  // ================================================================

  describe("CHAOS Token Gate", function () {
    it("should allow creation without CHAOS when gate is disabled", async function () {
      const deadline = await futureDeadline();
      // Gate disabled by default, user has 0 CHAOS
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should block creation when gate enabled and user lacks CHAOS", async function () {
      await factory.connect(owner).toggleChaosGate();
      expect(await factory.chaosGateEnabled()).to.be.true;

      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE })
      ).to.be.revertedWith("Insufficient CHAOS tokens");
    });

    it("should allow creation when gate enabled and user has enough CHAOS", async function () {
      await factory.connect(owner).toggleChaosGate();
      // Mint 1000 CHAOS to user1
      await mockChaos.mint(user1.address, hre.ethers.parseEther("1000"));

      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should apply gate to featured markets too", async function () {
      await factory.connect(owner).toggleChaosGate();
      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createFeaturedMarket("Test?", deadline, { value: FEATURED_FEE })
      ).to.be.revertedWith("Insufficient CHAOS tokens");
    });

    it("should allow owner to adjust minimum CHAOS requirement", async function () {
      await factory.connect(owner).setMinChaosForCreation(hre.ethers.parseEther("500"));
      expect(await factory.minChaosForCreation()).to.equal(hre.ethers.parseEther("500"));
    });

    it("should toggle gate back off", async function () {
      await factory.connect(owner).toggleChaosGate();
      expect(await factory.chaosGateEnabled()).to.be.true;
      await factory.connect(owner).toggleChaosGate();
      expect(await factory.chaosGateEnabled()).to.be.false;
    });
  });

  // ================================================================
  // PLACING BETS
  // ================================================================

  describe("Placing Bets", function () {
    beforeEach(async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Will BTC hit 100k?", deadline, { value: STANDARD_FEE });
    });

    it("should allow placing a Yes bet", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      const market = await factory.markets(0);
      expect(market.totalYes).to.equal(hre.ethers.parseEther("1.0"));
      expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0"));
    });

    it("should allow placing a No bet", async function () {
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("0.5") });
      const market = await factory.markets(0);
      expect(market.totalNo).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("should revert on zero bet", async function () {
      await expect(factory.connect(user1).placeBet(0, true)).to.be.revertedWith("Zero bet");
    });

    it("should revert on non-existent market", async function () {
      await expect(
        factory.connect(user1).placeBet(999, true, { value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Market does not exist");
    });

    it("should accumulate multiple bets from same user", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("0.5") });
      expect(await factory.yesBets(0, user1.address)).to.equal(hre.ethers.parseEther("1.5"));
    });

    it("should emit BetPlaced event", async function () {
      await expect(factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") }))
        .to.emit(factory, "BetPlaced")
        .withArgs(0, user1.address, true, hre.ethers.parseEther("1.0"));
    });
  });

  // ================================================================
  // MARKET DEADLINE ENFORCEMENT
  // ================================================================

  describe("Market Deadline Enforcement", function () {
    it("should revert resolving before deadline", async function () {
      const deadline = await futureDeadline(ONE_DAY * 7);
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.revertedWith("Market deadline not reached");
    });

    it("should allow resolving at deadline", async function () {
      const deadline = await futureDeadline(ONE_DAY);
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;
    });

    it("should allow resolving after deadline", async function () {
      const deadline = await futureDeadline(ONE_DAY);
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });

      await time.increaseTo(deadline + ONE_DAY);
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;
    });
  });

  // ================================================================
  // RESOLUTION & DISPUTE WINDOW
  // ================================================================

  describe("Resolution Dispute Window", function () {
    let deadline;

    beforeEach(async function () {
      deadline = await futureDeadline(ONE_DAY);
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);
    });

    it("should record resolvedAt timestamp", async function () {
      const resolvedTime = await factory.resolvedAt(0);
      expect(resolvedTime).to.be.gt(0);
    });

    it("should report dispute window as active right after resolution", async function () {
      expect(await factory.isDisputeWindowActive(0)).to.be.true;
    });

    it("should block claims during dispute window", async function () {
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Dispute window active");
    });

    it("should allow owner to override resolution during dispute window", async function () {
      await factory.connect(owner).overrideResolution(0, false);
      const market = await factory.markets(0);
      expect(market.result).to.be.false;
    });

    it("should emit ResolutionOverridden event", async function () {
      await expect(factory.connect(owner).overrideResolution(0, false))
        .to.emit(factory, "ResolutionOverridden")
        .withArgs(0, false);
    });

    it("should not allow non-owner to override", async function () {
      await expect(
        factory.connect(user1).overrideResolution(0, false)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should block override after dispute window closes", async function () {
      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);
      await expect(
        factory.connect(owner).overrideResolution(0, false)
      ).to.be.revertedWith("Dispute window closed");
    });

    it("should allow claims after dispute window", async function () {
      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      expect(await factory.isDisputeWindowActive(0)).to.be.false;

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);

      // Pool: 2 ETH, Fee: 0.05 ETH, Payout: 1.95 ETH
      expect(balAfter + gasCost - balBefore).to.equal(hre.ethers.parseEther("1.95"));
    });
  });

  // ================================================================
  // BET RECLAMATION
  // ================================================================

  describe("Bet Reclamation", function () {
    let deadline;

    beforeEach(async function () {
      deadline = await futureDeadline(ONE_DAY);
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
    });

    it("should revert reclaim before grace period", async function () {
      await time.increaseTo(deadline + ONE_DAY);
      await expect(factory.connect(user1).reclaimBet(0)).to.be.revertedWith("Reclaim period not reached");
    });

    it("should allow reclaim after deadline + 7 days", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);

      expect(await factory.canReclaim(0)).to.be.true;

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).reclaimBet(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);

      // user1 bet 2 ETH, gets full 2 ETH back (no fee on reclaim)
      expect(balAfter + gasCost - balBefore).to.equal(hre.ethers.parseEther("2.0"));
    });

    it("should emit BetReclaimed event", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);
      await expect(factory.connect(user1).reclaimBet(0))
        .to.emit(factory, "BetReclaimed")
        .withArgs(0, user1.address, hre.ethers.parseEther("2.0"));
    });

    it("should revert reclaim if already reclaimed", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);
      await factory.connect(user1).reclaimBet(0);
      await expect(factory.connect(user1).reclaimBet(0)).to.be.revertedWith("Already reclaimed");
    });

    it("should revert reclaim if no bets", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);
      await expect(factory.connect(user3).reclaimBet(0)).to.be.revertedWith("No bets to reclaim");
    });

    it("should revert reclaim if market is resolved", async function () {
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);
      await time.increase(SEVEN_DAYS + ONE_DAY + 1);
      await expect(factory.connect(user1).reclaimBet(0)).to.be.revertedWith("Market already resolved");
    });

    it("should update pool and totals after reclaim", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);
      await factory.connect(user1).reclaimBet(0);

      const market = await factory.markets(0);
      expect(market.totalYes).to.equal(0);
      expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0")); // only user2's bet remains
    });

    it("should allow multiple users to reclaim independently", async function () {
      await time.increaseTo(deadline + SEVEN_DAYS + 1);

      await factory.connect(user1).reclaimBet(0);
      await factory.connect(user2).reclaimBet(0);

      const market = await factory.markets(0);
      expect(market.ethPool).to.equal(0);
    });
  });

  // ================================================================
  // FEE CONFIG UPDATES
  // ================================================================

  describe("Fee Config Updates", function () {
    it("should allow owner to update fee config", async function () {
      await factory.connect(owner).updateFeeConfig(7000, 2000, 1000);
      expect(await factory.burnBps()).to.equal(7000);
      expect(await factory.creatorBps()).to.equal(2000);
      expect(await factory.agentBps()).to.equal(1000);
    });

    it("should emit FeeConfigUpdated event", async function () {
      await expect(factory.connect(owner).updateFeeConfig(7000, 2000, 1000))
        .to.emit(factory, "FeeConfigUpdated")
        .withArgs(7000, 2000, 1000);
    });

    it("should revert if not summing to 10000", async function () {
      await expect(
        factory.connect(owner).updateFeeConfig(5000, 3000, 1000)
      ).to.be.revertedWith("Must sum to 100%");
    });

    it("should revert if burn < 50%", async function () {
      await expect(
        factory.connect(owner).updateFeeConfig(4999, 3001, 2000)
      ).to.be.revertedWith("Burn must be >= 50%");
    });

    it("should allow exactly 50% burn", async function () {
      await factory.connect(owner).updateFeeConfig(5000, 3000, 2000);
      expect(await factory.burnBps()).to.equal(5000);
    });

    it("should revert if non-owner tries to update", async function () {
      await expect(
        factory.connect(user1).updateFeeConfig(7000, 2000, 1000)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should use updated fee split in resolution", async function () {
      // Set 50% burn, 30% creator, 20% agent
      await factory.connect(owner).updateFeeConfig(5000, 3000, 2000);

      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });

      const creatorBalBefore = await hre.ethers.provider.getBalance(owner.address);
      await time.increaseTo(deadline);
      const tx = await factory.connect(agent).resolveMarket(0, true);
      const receipt = await tx.wait();
      const creatorBalAfter = await hre.ethers.provider.getBalance(owner.address);

      // 10 ETH pool, 2.5% fee = 0.25 ETH
      // Creator gets 30% of 0.25 = 0.075 ETH
      expect(creatorBalAfter - creatorBalBefore).to.equal(hre.ethers.parseEther("0.075"));
    });
  });

  // ================================================================
  // PAUSE / UNPAUSE
  // ================================================================

  describe("Pause / Unpause", function () {
    it("should toggle pause on", async function () {
      await factory.connect(owner).togglePause();
      expect(await factory.paused()).to.be.true;
    });

    it("should emit Paused event", async function () {
      await expect(factory.connect(owner).togglePause())
        .to.emit(factory, "Paused")
        .withArgs(true);
    });

    it("should block createMarket when paused", async function () {
      await factory.connect(owner).togglePause();
      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE })
      ).to.be.revertedWith("Paused");
    });

    it("should block createFeaturedMarket when paused", async function () {
      await factory.connect(owner).togglePause();
      const deadline = await futureDeadline();
      await expect(
        factory.connect(user1).createFeaturedMarket("Test?", deadline, { value: FEATURED_FEE })
      ).to.be.revertedWith("Paused");
    });

    it("should block placeBet when paused", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(owner).togglePause();
      await expect(
        factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Paused");
    });

    it("should block resolveMarket when paused", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(owner).togglePause();
      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.revertedWith("Paused");
    });

    it("should NOT block claim when paused (users must always be able to withdraw)", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      // Pause after resolution
      await factory.connect(owner).togglePause();

      // Wait for dispute window
      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      // Should still be able to claim
      await factory.connect(user1).claim(0);
    });

    it("should unpause and allow operations again", async function () {
      await factory.connect(owner).togglePause();
      await factory.connect(owner).togglePause();
      expect(await factory.paused()).to.be.false;

      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should revert if non-owner tries to toggle pause", async function () {
      await expect(
        factory.connect(user1).togglePause()
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  // ================================================================
  // CLAIMING WINNINGS (V2 FEATURE PRESERVATION)
  // ================================================================

  describe("Claiming Winnings", function () {
    it("should allow winner to claim correct payout after dispute window", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);

      // Pool: 2 ETH, Fee: 0.05 ETH, Payout pool: 1.95 ETH
      expect(balAfter + gasCost - balBefore).to.equal(hre.ethers.parseEther("1.95"));
    });

    it("should distribute proportionally among multiple winners", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user3).placeBet(0, true, { value: hre.ethers.parseEther("3.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("4.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      // Pool: 8 ETH, Fee: 0.2 ETH, Payout: 7.8 ETH
      // user1: 1/4 of Yes pool = 1.95 ETH
      const bal1Before = await hre.ethers.provider.getBalance(user1.address);
      const tx1 = await factory.connect(user1).claim(0);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;
      const bal1After = await hre.ethers.provider.getBalance(user1.address);
      expect(bal1After + gas1 - bal1Before).to.equal(hre.ethers.parseEther("1.95"));

      // user3: 3/4 of Yes pool = 5.85 ETH
      const bal3Before = await hre.ethers.provider.getBalance(user3.address);
      const tx3 = await factory.connect(user3).claim(0);
      const receipt3 = await tx3.wait();
      const gas3 = receipt3.gasUsed * receipt3.gasPrice;
      const bal3After = await hre.ethers.provider.getBalance(user3.address);
      expect(bal3After + gas3 - bal3Before).to.equal(hre.ethers.parseEther("5.85"));
    });

    it("should revert double claim", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      await factory.connect(user1).claim(0);
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Already claimed");
    });

    it("should revert claim from loser", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      await expect(factory.connect(user2).claim(0)).to.be.revertedWith("No winning bet");
    });
  });

  // ================================================================
  // NO-WINNER REFUND (V2 FEATURE PRESERVATION)
  // ================================================================

  describe("No Winner Refund", function () {
    it("should refund losing-side bettors proportionally when no winners", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);

      const resolvedTime = await factory.resolvedAt(0);
      await time.increaseTo(Number(resolvedTime) + ONE_DAY + 1);

      // Pool: 3 ETH, Fee: 0.075 ETH, Refund pool: 2.925 ETH
      // user1: 2/3 of pool = 1.95 ETH
      const bal1Before = await hre.ethers.provider.getBalance(user1.address);
      const tx1 = await factory.connect(user1).claim(0);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;
      const bal1After = await hre.ethers.provider.getBalance(user1.address);
      expect(bal1After + gas1 - bal1Before).to.equal(hre.ethers.parseEther("1.95"));
    });

    it("should emit NoWinnerRefund event", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      await time.increaseTo(deadline);
      await expect(factory.connect(agent).resolveMarket(0, true))
        .to.emit(factory, "NoWinnerRefund")
        .withArgs(0, hre.ethers.parseEther("0.975"));
    });
  });

  // ================================================================
  // FEE ROUTING (V2 FEATURE PRESERVATION)
  // ================================================================

  describe("Fee Routing", function () {
    it("should send correct creator fee on resolution", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });

      const creatorBalBefore = await hre.ethers.provider.getBalance(owner.address);
      await time.increaseTo(deadline);
      await factory.connect(agent).resolveMarket(0, true);
      const creatorBalAfter = await hre.ethers.provider.getBalance(owner.address);

      // 10 ETH pool, 2.5% = 0.25 ETH total fee
      // Creator gets 9% of 0.25 = 0.0225 ETH
      expect(creatorBalAfter - creatorBalBefore).to.equal(hre.ethers.parseEther("0.0225"));
    });

    it("should send correct agent fee on resolution", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });

      const agentBalBefore = await hre.ethers.provider.getBalance(agent.address);
      await time.increaseTo(deadline);
      const tx = await factory.connect(agent).resolveMarket(0, true);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const agentBalAfter = await hre.ethers.provider.getBalance(agent.address);

      // Agent gets 1% of 0.25 = 0.0025 ETH (minus gas)
      expect(agentBalAfter + gasCost - agentBalBefore).to.equal(hre.ethers.parseEther("0.0025"));
    });
  });

  // ================================================================
  // SECURITY
  // ================================================================

  describe("Security", function () {
    it("should not allow external calls to buyAndBurn", async function () {
      await expect(
        factory.connect(user1).buyAndBurn(hre.ethers.parseEther("1.0"), { value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Internal only");
    });

    it("should revert resolving non-existent markets with no bets", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await time.increaseTo(deadline);
      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.revertedWith("No bets placed");
    });

    it("should handle reentrancy protection on placeBet", async function () {
      const deadline = await futureDeadline();
      await factory.connect(user1).createMarket("Test?", deadline, { value: STANDARD_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      const market = await factory.markets(0);
      expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0"));
    });
  });
});
