// Completely suppress stdout to prevent GalaChain decorator logs from breaking JSON output
const originalStdoutWrite = process.stdout.write;
const buffer: string[] = [];
let suppress = true;

// @ts-ignore
process.stdout.write = function (chunk: any, encoding: any, callback: any) {
  if (suppress) {
    if (typeof callback === "function") callback();
    return true;
  }
  return originalStdoutWrite.apply(this, arguments as any);
};

import { contracts } from "./index";

function getContractNames() {
  const names = contracts.map((contract) => {
    const instance = new contract() as any;
    const name = instance.name || instance.contractName || contract.name;
    return { contractName: name };
  });
  console.log(JSON.stringify(names));
  process.exit(0);
}

suppress = false;

if (process.argv.includes("get-contract-names")) {
  getContractNames();
} else {
  console.log(JSON.stringify([]));
  process.exit(0);
}
