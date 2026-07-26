"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.contracts = exports.KleeblattCoinContract = void 0;
var KleeblattCoinContract_1 = require("./contracts/KleeblattCoinContract");
Object.defineProperty(exports, "KleeblattCoinContract", { enumerable: true, get: function () { return KleeblattCoinContract_1.KleeblattCoinContract; } });
var contracts_1 = require("./contracts");
Object.defineProperty(exports, "contracts", { enumerable: true, get: function () { return contracts_1.contracts; } });
//# sourceMappingURL=index.js.map