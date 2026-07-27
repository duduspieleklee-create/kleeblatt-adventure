"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const KleeblattCoinContract_1 = require("./contracts/KleeblattCoinContract");
async function main() {
    const contract = new KleeblattCoinContract_1.KleeblattCoinContract();
    const args = process.argv.slice(2);
    const command = args[0];
    if (command === 'get-contract-names') {
        console.log(JSON.stringify(['KleeblattCoinContract']));
        return;
    }
    console.log(JSON.stringify([]));
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=cli.js.map