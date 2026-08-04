import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "./tasks/index.ts";

const IMX_TESTNET_RPC = process.env.IMX_TESTNET_RPC || "https://rpc.testnet.immutable.com";
const IMX_TESTNET_PRIVATE_KEY = process.env.IMX_TESTNET_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    immutableTestnet: {
      url: IMX_TESTNET_RPC,
      chainId: 13371,
      accounts: IMX_TESTNET_PRIVATE_KEY ? [IMX_TESTNET_PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;