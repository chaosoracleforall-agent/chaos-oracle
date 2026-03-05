import { expect } from "chai";
import hre from "hardhat";

describe("PredictionMarketFactory", function () {
  let factory, creator, agent, user1, user2;
  const CHAOS_TOKEN = hre.ethers.ZeroAddress; // Mock
  const AERODROME_ROUTER = hre.ethers.ZeroAddress; // Mock to avoid real swap
  const WETH = hre.ethers.ZeroAddress; // Mock

  beforeEach(async function () {
    [creator, agent, user1, user2] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("PredictionMarketFactory");
    factory = await Factory.deploy(creator.address, agent.address, CHAOS_TOKEN, AERODROME_ROUTER, WETH);
  });

  it("should create a market correctly", async function () {
    await factory.connect(user1).createMarket("Will BTC hit 100k?");
    const market = await factory.markets(0);
    expect(market.question).to.equal("Will BTC hit 100k?");
    expect(market.resolved).to.be.false;
  });

  it("should allow placing bets", async function () {
    await factory.connect(user1).createMarket("Will BTC hit 100k?");
    await factory.connect(user2).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
    const market = await factory.markets(0);
    expect(market.ethPool).to.equal(hre.ethers.parseEther("1.0"));
    expect(market.totalYes).to.equal(hre.ethers.parseEther("1.0"));
  });

  it("should resolve market and allow claiming", async function () {
    await factory.connect(user1).createMarket("Will BTC hit 100k?");
    await factory.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
    await factory.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("1.0") });
    
    // Agent resolves the market (Result: Yes)
    await factory.connect(agent).resolveMarket(0, true);
    const market = await factory.markets(0);
    expect(market.resolved).to.be.true;

    // User 1 claims
    const user1BalanceBefore = await hre.ethers.provider.getBalance(user1.address);
    const tx = await factory.connect(user1).claim(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const user1BalanceAfter = await hre.ethers.provider.getBalance(user1.address);
    // User 1 put in 1 ETH, pool is 2 ETH. Total fee is 2.5% = 0.05 ETH
    // Pool to distribute = 1.95 ETH. User 1 had 100% of Yes bets, so they get 1.95 ETH
    // user1BalanceAfter = user1BalanceBefore + 1.95 - gasUsed
    
    expect(user1BalanceAfter + gasUsed - user1BalanceBefore).to.equal(hre.ethers.parseEther("1.95"));
  });

  it("should revert if non-agent tries to resolve", async function () {
    await factory.connect(user1).createMarket("Will BTC hit 100k?");
    await expect(factory.connect(user1).resolveMarket(0, true)).to.be.revertedWith("Only Chaos Oracle can resolve");
  });
});
