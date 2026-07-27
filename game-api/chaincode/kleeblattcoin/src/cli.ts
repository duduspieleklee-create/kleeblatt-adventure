import 'reflect-metadata';
import { KleeblattCoinContract } from './contracts/KleeblattCoinContract';
import { GalaChainContext } from '@gala-chain/chaincode';

async function main() {
  const contract = new KleeblattCoinContract();
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