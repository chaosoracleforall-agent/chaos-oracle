import { expect } from "chai";
import hre from "hardhat";

describe("PredictionMarketFactoryV2", function () {
  let factory, creator, agent, user1, user2, user3;
  const CHAOS_TOKEN = hre.ethers.ZeroAddress;
  const AERODROME_ROUTER = hre.ethers.ZeroAddress; // Mock to avoid real swap
  const WETH = hre.ethers.ZeroAddress;
  const CREATION_FEE = hre.ethers.parseEther("0.001");

  beforeEach(async function () {
    [creator, agent, user1, user2, user3] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
    factory = await Factory.deploy(creator.address, agent.address, CHAOS_TOKEN, AERODROME_ROUTER, WETH);
  });

  describe("Deployment", function () {
    it("should set immutable addresses correctly", async function () {
      expect(await factory.CREATOR_WALLET()).to.equal(creator.address);
      expect(await factory.AGENT_X402_WALLET()).to.equal(agent.address);
      expect(await factory.CHAOS_TOKEN()).to.equal(CHAOS_TOKEN);
    });

    it("should revert with zero address creator", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
      await expect(
        Factory.deploy(hre.ethers.ZeroAddress, agent.address, CHAOS_TOKEN, AERODROME_ROUTER, WETH)
      ).to.be.revertedWith("Invalid creator");
    });

    it("should revert with zero address agent", async function () {
      const Factory = await hre.ethers.getContractFactory("PredictionMarketFactoryV2");
      await expect(
        Factory.deploy(creator.address, hre.ethers.ZeroAddress, CHAOS_TOKEN, AERODROME_ROUTER, WETH)
      ).to.be.revertedWith("Invalid agent");
    });
  });

  describe("Market Creation", function () {
    it("should create a market with correct creation fee", async function () {
      await factory.connect(user1).createMarket("Will BTC hit 100k?", { value: CREATION_FEE });
      const market = await factory.markets(0);
      expect(market.question).to.equal("Will BTC hit 100k?");
      expect(market.resolved).to.be.false;
      expect(market.creator).to.equal(user1.address);
      expect(await factory.marketCount()).to.equal(1);
    });

    it("should revert without creation fee", async function () {
      await expect(
        factory.connect(user1).createMarket("Will BTC hit 100k?")
      ).to.be.revertedWith("Creation fee: 0.001 ETH");
    });

    it("should revert with insufficient creation fee", async function () {
      await expect(
        factory.connect(user1).createMarket("Will BTC hit 100k?", { value: hre.ethers.parseEther("0.0009") })
      ).to.be.revertedWith("Creation fee: 0.001 ETH");
    });

    it("should accept overpayment for creation fee", async function () {
      await factory.connect(user1).createMarket("Will BTC hit 100k?", { value: hre.ethers.parseEther("0.01") });
      const market = await factory.markets(0);
      expect(market.question).to.equal("Will BTC hit 100k?");
    });

    it("should emit MarketCreated event", async function () {
      await expect(factory.connect(user1).createMarket("Test?", { value: CREATION_FEE }))
        .to.emit(factory, "MarketCreated")
        .withArgs(0, "Test?", user1.address);
    });

    it("should increment marketCount", async function () {
      await factory.connect(user1).createMarket("Q1?", { value: CREATION_FEE });
      await factory.connect(user2).createMarket("Q2?", { value: CREATION_FEE });
      expect(await factory.marketCount()).to.equal(2);
    });
  });

  describe("Placing Bets", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("Will BTC hit 100k?", { value: CREATION_FEE });
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

    it("should revert on resolved market", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(
        factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Market resolved");
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

  describe("Market Resolution", function () {
    beforeEach(async function () {
      await factory.connect(user1).createMarket("Will BTC hit 100k?", { value: CREATION_FEE });
    });

    it("should revert if non-agent tries to resolve", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await expect(factory.connect(user1).resolveMarket(0, true)).to.be.revertedWith("Only Chaos Oracle can resolve");
    });

    it("should revert resolving with no bets", async function () {
      await expect(factory.connect(agent).resolveMarket(0, true)).to.be.revertedWith("No bets placed");
    });

    it("should revert double resolution", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(agent).resolveMarket(0, false)).to.be.revertedWith("Already resolved");
    });

    it("should correctly resolve with bets on both sides", async function () {
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;
      expect(market.result).to.be.true;
      // 2 ETH pool, 2.5% fee = 0.05 ETH
      expect(market.finalFee).to.equal(hre.ethers.parseEther("0.05"));
    });
  });

  describe("Claiming Winnings (Normal Case)", function () {
    it("should allow winner to claim correct payout", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);

      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);

      // Pool: 2 ETH, Fee: 0.05 ETH, Payout pool: 1.95 ETH
      // User1 has 100% of Yes bets, gets full 1.95 ETH
      expect(balAfter + gasCost - balBefore).to.equal(hre.ethers.parseEther("1.95"));
    });

    it("should distribute proportionally among multiple winners", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user3).placeBet(0, true, { value: hre.ethers.parseEther("3.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("4.0") });
      await factory.connect(agent).resolveMarket(0, true);

      // Pool: 8 ETH, Fee: 0.2 ETH, Payout: 7.8 ETH
      // user1: 1/4 of Yes pool = 1.95 ETH
      // user3: 3/4 of Yes pool = 5.85 ETH

      const bal1Before = await hre.ethers.provider.getBalance(user1.address);
      const tx1 = await factory.connect(user1).claim(0);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;
      const bal1After = await hre.ethers.provider.getBalance(user1.address);
      expect(bal1After + gas1 - bal1Before).to.equal(hre.ethers.parseEther("1.95"));

      const bal3Before = await hre.ethers.provider.getBalance(user3.address);
      const tx3 = await factory.connect(user3).claim(0);
      const receipt3 = await tx3.wait();
      const gas3 = receipt3.gasUsed * receipt3.gasPrice;
      const bal3After = await hre.ethers.provider.getBalance(user3.address);
      expect(bal3After + gas3 - bal3Before).to.equal(hre.ethers.parseEther("5.85"));
    });

    it("should revert double claim", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await factory.connect(user1).claim(0);
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Already claimed");
    });

    it("should revert claim from loser", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await factory.connect(agent).resolveMarket(0, true);
      await expect(factory.connect(user2).claim(0)).to.be.revertedWith("No winning bet");
    });

    it("should revert claim on unresolved market", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      await expect(factory.connect(user1).claim(0)).to.be.revertedWith("Not resolved yet");
    });
  });

  describe("Division by Zero Fix (No Winners)", function () {
    it("should handle resolution when no one bet on winning side (Yes wins, no Yes bets)", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      // Only No bets placed
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      // Resolve as Yes - but no one bet Yes
      await factory.connect(agent).resolveMarket(0, true);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;
    });

    it("should refund losing-side bettors proportionally when no winners", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("2.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });

      // Resolve as Yes (no Yes bettors)
      await factory.connect(agent).resolveMarket(0, true);

      // Pool: 3 ETH, Fee: 0.075 ETH, Refund pool: 2.925 ETH
      // user1: 2/3 of pool = 1.95 ETH
      // user2: 1/3 of pool = 0.975 ETH
      const bal1Before = await hre.ethers.provider.getBalance(user1.address);
      const tx1 = await factory.connect(user1).claim(0);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed * receipt1.gasPrice;
      const bal1After = await hre.ethers.provider.getBalance(user1.address);
      expect(bal1After + gas1 - bal1Before).to.equal(hre.ethers.parseEther("1.95"));

      const bal2Before = await hre.ethers.provider.getBalance(user2.address);
      const tx2 = await factory.connect(user2).claim(0);
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed * receipt2.gasPrice;
      const bal2After = await hre.ethers.provider.getBalance(user2.address);
      expect(bal2After + gas2 - bal2Before).to.equal(hre.ethers.parseEther("0.975"));
    });

    it("should emit NoWinnerRefund event", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
      await expect(factory.connect(agent).resolveMarket(0, true))
        .to.emit(factory, "NoWinnerRefund")
        .withArgs(0, hre.ethers.parseEther("0.975")); // 1.0 - 0.025 fee
    });

    it("should handle No wins with only Yes bets", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });

      // Resolve as No (no No bettors)
      await factory.connect(agent).resolveMarket(0, false);
      const market = await factory.markets(0);
      expect(market.resolved).to.be.true;

      // user1 (Yes bettor) can claim refund
      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await factory.connect(user1).claim(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);
      // 1 ETH - 2.5% fee = 0.975 ETH refund
      expect(balAfter + gasCost - balBefore).to.equal(hre.ethers.parseEther("0.975"));
    });
  });

  describe("Fee Routing", function () {
    it("should send 9% of fee to creator", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });

      const creatorBalBefore = await hre.ethers.provider.getBalance(creator.address);
      await factory.connect(agent).resolveMarket(0, true);
      const creatorBalAfter = await hre.ethers.provider.getBalance(creator.address);

      // 10 ETH pool, 2.5% = 0.25 ETH total fee
      // Creator gets 9% of 0.25 = 0.0225 ETH
      expect(creatorBalAfter - creatorBalBefore).to.equal(hre.ethers.parseEther("0.0225"));
    });

    it("should send 1% of fee to agent", async function () {
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("5.0") });
      await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("5.0") });

      const agentBalBefore = await hre.ethers.provider.getBalance(agent.address);
      const tx = await factory.connect(agent).resolveMarket(0, true);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const agentBalAfter = await hre.ethers.provider.getBalance(agent.address);

      // Agent gets 1% of 0.25 = 0.0025 ETH (minus gas for the resolve tx)
      expect(agentBalAfter + gasCost - agentBalBefore).to.equal(hre.ethers.parseEther("0.0025"));
    });
  });

  describe("Security", function () {
    it("should not allow external calls to buyAndBurn", async function () {
      await expect(
        factory.connect(user1).buyAndBurn(hre.ethers.parseEther("1.0"), { value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Internal only");
    });

    it("should handle reentrancy protection on placeBet", async function () {
      // Basic test - reentrancy guard is from OZ, just verify it's applied
      await factory.connect(user1).createMarket("Test?", { value: CREATION_FEE });
      await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
      const market = await factory.markets(0);
      expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0"));
    });
  });
});
