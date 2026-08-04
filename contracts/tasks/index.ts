import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task(
  "mint-item",
  "Mint a test item to an address on Immutable testnet"
).addParam("to", "Recipient address")
  .addParam("name", "Item name")
  .addParam("rarity", "Rarity (0-4)", "0")
  .addParam("power", "Item power", "10")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const itemContract = await hre.ethers.getContractAt("KleeblattItem", process.env.ITEM_CONTRACT_ADDRESS!);

    const tx = await itemContract.mintItem(
      taskArgs.to,
      hre.ethers.id(taskArgs.name),
      parseInt(taskArgs.rarity),
      parseInt(taskArgs.rarity),
      taskArgs.name,
      `Test item: ${taskArgs.name}`,
      parseInt(taskArgs.power)
    );
    await tx.wait();
    console.log("Item minted:", tx.hash);
  })
;

task(
  "mint-tokens",
  "Mint KLT tokens to an address"
).addParam("to", "Recipient address")
  .addParam("amount", "Amount in tokens", "100")
  .setAction(async (taskArgs: TaskArguments, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const tokenContract = await hre.ethers.getContractAt("KleeblattToken", process.env.TOKEN_CONTRACT_ADDRESS!);

    const amount = hre.ethers.parseUnits(taskArgs.amount, 18);
    const tx = await tokenContract.mint(taskArgs.to, amount);
    await tx.wait();
    console.log("Tokens minted:", tx.hash);
  })
;