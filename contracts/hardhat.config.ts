import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
        settings: {
          viaIR: true, // Enable IR-based compilation to avoid "stack too deep" errors
        },
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // Enable IR-based compilation to avoid "stack too deep" errors
        },
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    saga: {
      type: "http",
      chainType: "l1",
      url: "https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io",
      accounts: process.env.SAGA_PRIVATE_KEY 
        ? [process.env.SAGA_PRIVATE_KEY]
        : [configVariable("SAGA_PRIVATE_KEY")],
      chainId: 2763823383026000, // Saga chainlet chain ID
    },
  },
});
