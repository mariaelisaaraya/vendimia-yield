require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "london", // RSK compatible
    },
  },
  networks: {
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      gasPrice: 65000000,
      accounts: [DEPLOYER_KEY],
    },
    rskMainnet: {
      url: "https://public-node.rsk.co",
      chainId: 30,
      gasPrice: 65000000,
      accounts: [DEPLOYER_KEY],
    },
  },
};
