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

import { GalaContract } from "@gala-chain/chaincode";

export class KleeblattCoinContract extends GalaContract {
  constructor() {
    super("KleeblattCoinContract");
  }
}

export { contracts } from "./contracts";
