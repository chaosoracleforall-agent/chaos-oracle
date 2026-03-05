require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: ["0xfa7414e040cefdbc2e288881fed8eaca1321a741ddbf3e43bb557dfe442bd47b"],
    }
  }
};
