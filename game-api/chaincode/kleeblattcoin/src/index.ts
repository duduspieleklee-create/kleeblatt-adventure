/**
 * KleeblattCoin — GalaChain Token Contract
 *
 * Fungible token (KLB) awarded to top 10 daily leaderboard winners.
 * Built on GalaChainTokenContract from the GalaChain SDK template.
 *
 * Deployment:
 *   galachain init kleeblattcoin
 *   galachain deploy --network=gc-testnet
 *
 * Token class:
 *   collection: Kleeblatt
 *   category: Coin
 *   type: KleeblattCoin
 *   additionalKey: v1
 */

export { KleeblattCoinContract } from "./contracts/KleeblattCoinContract";

export { contracts } from "./contracts";
