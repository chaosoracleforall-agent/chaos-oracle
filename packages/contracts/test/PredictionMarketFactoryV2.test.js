import { expect } from "chai";
import hre from "hardhat";

describe("PredictionMarketFactoryV2", function () {
  let factory, creator, agent, user1, user2, user3;
  const CHAOS_TOKEN = "0xA1864203355AeFAd58c051aC984672a6585C77C9";
  const AERODROME_ROUTER = hre.ethers.ZeroAddress; // Mock — buyAndBurn will fail, testing pendingBurnETH
  const WETH = "0x4200000000000000000000000000000000000006";
  const CREATION_FEE = hre.ethers.parseEther("0.001");

  beforeEach(async function () {
    [creator, agent, user1, user2, user3] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
    factory = await Factory.deploy(creator.address, agent.address, CHAOS_TOKEN, AERODROME_ROUTER, WETH);
  });

  // ==================== DEPLOYMENT ====================

  describe("Deployment", function () {
    it("should set immutable addresses correctly", async function () {
      expect(await factory.CREATOR_WALLET()).to.equal(creator.address);
      expect(await factory.AGENT_WALLET()).to.equal(agent.address);
      expect(await factory.CHAOS_TOKEN()).to.equal(CHAOS_TOKEN);
      expect(await factory.WETH()).to.equal(WETH);
    });

    it("should revert with zero address creator", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
      await expect(Factory.deploy(hre.ethers.ZeroAddress, agent.address, CHAOS_TOKEN, AERODROME_ROUTER, WETH))
        .to.be.revertedWith("Invalid creator");
    });

    it("should revert with zero address agent", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
      await expect(Factory.deploy(creator.address, hre.ethers.ZeroAddress, CHAOS_TOKEN, AERODROME_ROUTER, WETH))
        .to.be.revertedWith("Invalid agent");
    });

    it("should start with zero markets", async function () {
      expect(await factory.marketCount()).to.equal(0);
    });
  });

  // ==================== MARKET CREATION ====================

  describe("Market Creation", function () {
    it("should create a market with creation fee", async function () {
      await factory.connect(user1).createMarket("Will BTC hit 200k?", { value: CREATION_FEE });
      const market = await factory.getMarket(0);
      expect(market.question).to.equal("Will BTC hit 200k?");
      expect(market.creator).to.equal(user1.address);
      expect(market.resolved).to.be.false;
      expect(market.createdAt).to.be.greaterThan(0);
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should send exactly MARKET_CREATION_FEE to agent wallet", async function () {
      const agentBalBefore = await hre.ethers.provider.getBalance(agent.address);
      await factory.connect(user1).createMarket("Test market", { value: CREATION_FEE });
      const agentBalAfter = await hre.ethers.provider.getBalance(agent.address);
      expect(agentBalAfter - agentBalBefore).to.equal(CREATION_FEE);
    });

    it("should refund overpayment of creation fee", async function () {
      const doubleFee = CREATION_FEE * 2n;
      const agentBalBefore = await hre.ethers.provider.getBalance(agent.address);
      const userBalBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).createMarket("Test", { value: doubleFee });
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const agentBalAfter = await hre.ethers.provider.getBalance(agent.address);
      const userBalAfter = await hre.ethers.provider.getBalance(user1.address);

      // Agent should only receive CREATION_FEE, not double
      expect(agentBalAfter - agentBalBefore).to.equal(CREATION_FEE);
      // User should get refund (paid doubleFee, got CREATION_FEE back, minus gas)
      expect(userBalBefore - userBalAfter - gas).to.equal(CREATION_FEE);
    });

    it("should revert without creation fee", async function () {
      await expect(factory.connect(user1).createMarket("Test"))
        .to.be.revertedWith("Insufficient creation fee");
    });

    it("should revert with insufficient creation fee", async function () {
      await expect(factory.connect(user1).createMarket("Test", { value: hre.ethers.parseEther("0.0005") }))
        .to.be.revertedWith("Insufficient creation fee");
    });

    it("should revert with empty question", async function () {
      await expect(factory.connect(user1).createMarket("", { value: CREATION_FEE }))
        .to.be.revertedWith("Empty question");
    });

    it("should revert with question over 500 chars", async function () {
      const longQ = "A".repeat(501);
      await expect(factory.connect(user1).createMarket(longQ, { value: CREATION_FEE }))
        .to.be.revertedWith("Question too long");
    });

    it("should create multiple markets with incrementing IDs", async function () {
      await factory.connect(user1).createMarket("Q1", { value: CREATION_FEE });
      await factory.connect(user2).createMarket("Q2", { value: CREATION_FEE });
      await factory.connect(user1).createMarket("Q3", { value: CREATION_FEE });
      expect(await factory.marketCount()).to.equal(3);
      expect((await factory.getMarket(1)).question).to.equal("Q2");
    });

    it("should emit MarketCreated event with exact fee", async function () {
      await expect(factory.connect(user1).createMarket("Test?", { value: CREATION_FEE }))
        .to.emit(factory, "MarketCreated")
        .withArgs(0, "Test?", user1.address, CREATION_FEE);
    });
  });

  // ==================== BETTING ====================

  describe("Betting", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("Will ETH hit 5k?", { value: CREATION_FEE });
    });

    it("should place a YES bet", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      const market = await factory.getMarket(0);
      expect(market.totalYes).to.equal(hre.ethers.parseEther("1.0"));
      expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0"));
    });

    it("should place a NO bet", async function () {
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("0.5") });
      const market = await factory.getMarket(0);
      expect(market.totalNo).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("should accumulate multiple bets from same user", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("0.5") });
      const bets = await factory.getUserBets(0, user1.address);
      expect(bets.yes).to.equal(hre.ethers.parseEther("1.5"));
    });

    it("should allow same user to bet both sides", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("0.5") });
      const bets = await factory.getUserBets(0, user1.address);
      expect(bets.yes).to.equal(hre.ethers.parseEther("1.0"));
      expect(bets.no).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("should revert on zero bet", async function () {
      await expect(factory.connect(user1).placeBet(0, true, { value: 0 }))
        .to.be.revertedWith("Zero bet");
    });

    it("should revert on nonexistent market", async function () {
      await expect(factory.connect(user1).placeBet(99, true, { value: hre.ethers.parseEther("1.0") }))
        .to.be.revertedWith("Market does not exist");
    });

    it("should revert on resolved market", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") }))
        .to.be.revertedWith("Market resolved");
    });

    it("should emit BetPlaced event", async function () {
      await expect(factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") }))
        .to.emit(factory, "BetPlaced")
        .withArgs(0, user1.address, true, hre.ethers.parseEther("1.0"));
    });
  });

  // ==================== RESOLUTION ====================

  describe("Resolution", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("Test market", { value: CREATION_FEE });
    });

    it("should resolve market correctly", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const market = await factory.getMarket(0);
      expect(market.resolved).to.be.true;
      expect(market.result).to.be.true;
      expect(market.resolvedAt).to.be.greaterThan(0);
      expect(market.finalFee).to.equal(hre.ethers.parseEther("0.05"));
    });

    it("should revert if non-agent tries to resolve", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await expect(factory.connect(user1).resolveMarket(0, true))
        .to.be.revertedWith("Only agent can call");
    });

    it("should revert if already resolved", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(agent).resolveMarket(0, false))
        .to.be.revertedWith("Already resolved");
    });

    it("should revert on nonexistent market", async function () {
      await expect(factory.connect(agent).resolveMarket(99, true))
        .to.be.revertedWith("Market does not exist");
    });

    it("should handle resolution with zero pool (no bets)", async function () {
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.getMarket(0);
      expect(market.resolved).to.be.true;
      expect(market.finalFee).to.equal(0);
    });

    it("should emit MarketResolved event", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("2.0") });
      await expect(factory.connect(agent).resolveMarket(0, true))
        .to.emit(factory, "MarketResolved")
        .withArgs(0, true, hre.ethers.parseEther("2.0"), hre.ethers.parseEther("0.05"));
    });
  });

  // ==================== CLAIMING ====================

  describe("Claiming", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
    });

    it("should pay winner correctly (2-sided market)", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);

      // Pool: 2 ETH, fee: 0.05 ETH, payout: 1.95 ETH
      expect(balAfter + gas - balBefore).to.equal(hre.ethers.parseEther("1.95"));
    });

    it("should distribute proportionally among multiple winners", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, true, { value: hre.ethers.parseEther("3.0") });
      await factory.connect(user3).placeBet(0, false, { value: hre.ethers.parseEther("4.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const bal1Before = await hre.ethers.provider.getBalance(user1.address);
      const tx1 = await factory.connect(user1).claim(0);
      const r1 = await tx1.wait();
      const gas1 = r1.gasUsed * r1.gasPrice;
      const bal1After = await hre.ethers.provider.getBalance(user1.address);
      expect(bal1After + gas1 - bal1Before).to.equal(hre.ethers.parseEther("1.95"));

      const bal2Before = await hre.ethers.provider.getBalance(user2.address);
      const tx2 = await factory.connect(user2).claim(0);
      const r2 = await tx2.wait();
      const gas2 = r2.gasUsed * r2.gasPrice;
      const bal2After = await hre.ethers.provider.getBalance(user2.address);
      expect(bal2After + gas2 - bal2Before).to.equal(hre.ethers.parseEther("5.85"));
    });

    it("should revert if not resolved", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Not resolved");
    });

    it("should revert on double claim", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(user1).claim(0);
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Already claimed");
    });

    it("should revert if user has no winning bet", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user2).claim(0)).to.be.revertedWith("No winning bet");
    });

    it("should revert on nonexistent market", async function () {
      await expect(factory.connect(user1).claim(999)).to.be.revertedWith("Market does not exist");
    });

    it("should emit WinningsClaimed event", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user1).claim(0))
        .to.emit(factory, "WinningsClaimed")
        .withArgs(0, user1.address, hre.ethers.parseEther("1.95"));
    });
  });

  // ==================== DIVISION-BY-ZERO / REFUND ====================

  describe("Division-by-zero Protection (Refunds)", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("One-sided market", { value: CREATION_FEE });
    });

    it("should set zero fee when no one bet on winning side", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.getMarket(0);
      expect(market.finalFee).to.equal(0);
    });

    it("should allow refund when no winners exist", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claimRefund(0);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);
      expect(balAfter + gas - balBefore).to.equal(hre.ethers.parseEther("2.0"));
    });

    it("should refund multiple users", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("3.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(user1).claimRefund(0);
      await factory.connect(user2).claimRefund(0);
      expect(await factory.hasClaimed(0, user1.address)).to.be.true;
      expect(await factory.hasClaimed(0, user2.address)).to.be.true;
    });

    it("should revert claimRefund when winners exist", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user2).claimRefund(0))
        .to.be.revertedWith("Winners exist, use claim()");
    });

    it("should revert claim when no winners exist", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("No winners");
    });

    it("should revert double refund", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(user1).claimRefund(0);
      await expect(factory.connect(user1).claimRefund(0)).to.be.revertedWith("Already claimed");
    });

    it("should revert claimRefund on nonexistent market", async function () {
      await expect(factory.connect(user1).claimRefund(999)).to.be.revertedWith("Market does not exist");
    });

    it("should emit RefundClaimed event", async function () {
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user1).claimRefund(0))
        .to.emit(factory, "RefundClaimed")
        .withArgs(0, user1.address, hre.ethers.parseEther("1.0"));
    });
  });

  // ==================== PULL-BASED FEE COLLECTION ====================

  describe("Pull-based Fee Collection (HIGH-2 Fix)", function () {
    it("should accumulate fees in pendingFees on resolution", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(agent).resolveMarket(0, true);

      // Pool: 10 ETH, fee: 0.25 ETH
      // Creator: 9% of 0.25 = 0.0225, Agent: 1% of 0.25 = 0.0025
      expect(await factory.pendingFees(creator.address)).to.equal(hre.ethers.parseEther("0.0225"));
      expect(await factory.pendingFees(agent.address)).to.equal(hre.ethers.parseEther("0.0025"));
    });

    it("should allow creator to withdraw accumulated fees", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const balBefore = await hre.ethers.provider.getBalance(creator.address);
      const tx = await factory.connect(creator).withdrawFees();
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(creator.address);

      expect(balAfter + gas - balBefore).to.equal(hre.ethers.parseEther("0.0225"));
      expect(await factory.pendingFees(creator.address)).to.equal(0);
    });

    it("should accumulate fees across multiple markets", async function () {
      await factory.connect(user1).createMarket("M1", { value: CREATION_FEE });
      await factory.connect(user1).createMarket("M2", { value: CREATION_FEE });

      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(agent).resolveMarket(0, true);

      await factory.connect(user1).placeBet(1, true, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(1, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(agent).resolveMarket(1, false);

      // Each market: 4 ETH pool, 0.1 ETH fee, creator gets 0.009 ETH each
      expect(await factory.pendingFees(creator.address)).to.equal(hre.ethers.parseEther("0.018"));
    });

    it("should revert withdrawFees with no pending fees", async function () {
      await expect(factory.connect(user1).withdrawFees()).to.be.revertedWith("No fees to withdraw");
    });

    it("should emit FeesWithdrawn event", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(agent).resolveMarket(0, true);

      await expect(factory.connect(creator).withdrawFees())
        .to.emit(factory, "FeesWithdrawn")
        .withArgs(creator.address, hre.ethers.parseEther("0.0225"));
    });
  });

  // ==================== PENDING BURN / RETRY (HIGH-3 Fix) ====================

  describe("Pending Burn ETH & Retry (HIGH-3 Fix)", function () {
    it("should accumulate burn ETH when router is zero address", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(agent).resolveMarket(0, true);

      // Fee: 0.25 ETH, burn portion: 90% = 0.225 ETH
      const creatorFee = hre.ethers.parseEther("0.0225");
      const agentFee = hre.ethers.parseEther("0.0025");
      const burnFee = hre.ethers.parseEther("0.25") - creatorFee - agentFee;
      expect(await factory.pendingBurnETH()).to.equal(burnFee);
    });

    it("should revert retryBurn with nothing pending", async function () {
      await expect(factory.connect(agent).retryBurn()).to.be.revertedWith("Nothing to retry");
    });

    it("should only allow agent to call retryBurn", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      await expect(factory.connect(user1).retryBurn()).to.be.revertedWith("Only agent can call");
    });
  });

  // ==================== PAUSE / UNPAUSE ====================

  describe("Emergency Pause", function () {
    it("should allow agent to pause", async function () {
      await expect(factory.connect(agent).pause())
        .to.emit(factory, "EmergencyPause")
        .withArgs(agent.address);
    });

    it("should block market creation when paused", async function () {
      await factory.connect(agent).pause();
      await expect(factory.connect(user1).createMarket("Test", { value: CREATION_FEE }))
        .to.be.reverted;
    });

    it("should block betting when paused", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(agent).pause();
      await expect(factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") }))
        .to.be.reverted;
    });

    it("should block resolution when paused", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).pause();
      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.reverted;
    });

    it("should still allow claims when paused (user protection)", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(agent).pause();
      await expect(factory.connect(user1).claim(0)).to.not.be.reverted;
    });

    it("should allow unpause and resume operations", async function () {
      await factory.connect(agent).pause();
      await factory.connect(agent).unpause();
      await expect(factory.connect(user1).createMarket("Test", { value: CREATION_FEE }))
        .to.not.be.reverted;
    });

    it("should revert if non-agent tries to pause", async function () {
      await expect(factory.connect(user1).pause()).to.be.revertedWith("Only agent can call");
    });

    it("should revert if non-agent tries to unpause", async function () {
      await factory.connect(agent).pause();
      await expect(factory.connect(user1).unpause()).to.be.revertedWith("Only agent can call");
    });
  });

  // ==================== VIEW FUNCTIONS ====================

  describe("View Functions", function () {
    it("should return user bets correctly", async function () {
      await factory.connect(user1).createMarket("Test", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("0.5") });
      const bets = await factory.getUserBets(0, user1.address);
      expect(bets.yes).to.equal(hre.ethers.parseEther("1.0"));
      expect(bets.no).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("should return full market data via getMarket", async function () {
      await factory.connect(user1).createMarket("Full test?", { value: CREATION_FEE });
      const market = await factory.getMarket(0);
      expect(market.question).to.equal("Full test?");
      expect(market.creator).to.equal(user1.address);
      expect(market.totalYes).to.equal(0);
      expect(market.totalNo).to.equal(0);
      expect(market.resolved).to.be.false;
      expect(market.ethPool).to.equal(0);
    });
  });

  // ==================== EDGE CASES ====================

  describe("Edge Cases", function () {
    it("should handle single bettor (only YES, result YES)", async function () {
      await factory.connect(user1).createMarket("Solo bet", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);
      expect(balAfter + gas - balBefore).to.equal(hre.ethers.parseEther("0.975"));
    });

    it("should handle very small bets", async function () {
      await factory.connect(user1).createMarket("Tiny bet", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: 1000 });
      await factory.connect(user2).placeBet(0, false, { value: 1000 });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(user1).claim(0);
    });

    it("should handle market with no bets resolved", async function () {
      await factory.connect(user1).createMarket("Empty market", { value: CREATION_FEE });
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.getMarket(0);
      expect(market.resolved).to.be.true;
      expect(market.finalFee).to.equal(0);
    });
  });
});
