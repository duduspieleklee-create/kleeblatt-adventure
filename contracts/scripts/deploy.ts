import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Network:", ethers.provider.network.name);

  const KleeblattToken = await ethers.getContractFactory("KleeblattToken");
  const klt = await KleeblattToken.deploy(deployer.address);
  await klt.waitForDeployment();
  console.log("KleeblattToken deployed to:", await klt.getAddress());

  const KleeblattItem = await ethers.getContractFactory("KleeblattItem");
  const kli = await KleeblattItem.deploy(deployer.address);
  await kli.waitForDeployment();
  console.log("KleeblattItem deployed to:", await kli.getAddress());

  const KleeblattMarketplace = await ethers.getContractFactory("KleeblattMarketplace");
  const mkt = await KleeblattMarketplace.deploy(deployer.address);
  await mkt.waitForDeployment();
  console.log("KleeblattMarketplace deployed to:", await mkt.getAddress());

  await mkt.setContracts(await kli.getAddress(), await klt.getAddress());
  console.log("Marketplace contracts configured");

  await kli.grantRole(await kli.DEFAULT_ADMIN_ROLE(), deployer.address);
  await klt.addMinter(await mkt.getAddress());

  console.log("\nDeployment complete!");
  console.log("KLT:", await klt.getAddress());
  console.log("KLI:", await kli.getAddress());
  console.log("MKT:", await mkt.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});