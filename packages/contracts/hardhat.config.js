import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0xfa7414e040cefdbc2e288881fed8eaca1321a741ddbf3e43bb557dfe442bd47b"]
    }
  }
};
