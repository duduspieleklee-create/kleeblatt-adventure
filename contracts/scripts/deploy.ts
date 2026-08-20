import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "chainId:", network.chainId.toString());

  // ─── KleeblattToken ────────────────────────────────────────────────────────
  const KleeblattToken = await ethers.getContractFactory("KleeblattToken");
  const klt = await KleeblattToken.deploy(deployer.address);
  await klt.waitForDeployment();
  const kltAddress = await klt.getAddress();
  console.log("KleeblattToken deployed to:", kltAddress);

  // ─── KleeblattItem ─────────────────────────────────────────────────────────
  const KleeblattItem = await ethers.getContractFactory("KleeblattItem");
  const kli = await KleeblattItem.deploy(deployer.address);
  await kli.waitForDeployment();
  const kliAddress = await kli.getAddress();
  console.log("KleeblattItem deployed to:", kliAddress);

  // ─── KleeblattMarketplace ──────────────────────────────────────────────────
  const KleeblattMarketplace = await ethers.getContractFactory("KleeblattMarketplace");
  const mkt = await KleeblattMarketplace.deploy(deployer.address);
  await mkt.waitForDeployment();
  const mktAddress = await mkt.getAddress();
  console.log("KleeblattMarketplace deployed to:", mktAddress);

  await mkt.setContracts(kliAddress, kltAddress);
  console.log("Marketplace contracts configured");

  await kli.grantRole(await kli.DEFAULT_ADMIN_ROLE(), deployer.address);
  await klt.addMinter(mktAddress);

  // ─── KleeblattStaking ──────────────────────────────────────────────────────
  // ~10% APR: rewardRatePerSecond = 1e17 / (365 * 24 * 3600)  (0.1 KLT per KLT per year)
  // = 100_000_000_000_000_000 / 31_536_000 ≈ 3_170_979_198
  const REWARD_RATE_PER_SECOND = 3_170_979_198n;
  const KleeblattStaking = await ethers.getContractFactory("KleeblattStaking");
  const staking = await KleeblattStaking.deploy(kltAddress, REWARD_RATE_PER_SECOND);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("KleeblattStaking deployed to:", stakingAddress);

  // Grant staking contract minter role so it can mint reward tokens
  await klt.addMinter(stakingAddress);
  console.log("Staking contract added as KLT minter");

  // Fund staking reward pool with 10,000 KLT from deployer
  const FUND_AMOUNT = ethers.parseUnits("10000", 18);
  await klt.approve(stakingAddress, FUND_AMOUNT);
  await staking.fundRewards(FUND_AMOUNT);
  console.log("Staking reward pool funded with 10,000 KLT");

  // ─── KleeblattWelcomeFaucet ────────────────────────────────────────────────
  // gameCaller = deployer (game server uses the same key). Rotate via setGameCaller
  // once a dedicated server key is set up.
  const KleeblattWelcomeFaucet = await ethers.getContractFactory("KleeblattWelcomeFaucet");
  const faucet = await KleeblattWelcomeFaucet.deploy(kltAddress, deployer.address);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("KleeblattWelcomeFaucet deployed to:", faucetAddress);

  // Grant faucet minter rights on KLT
  await klt.addMinter(faucetAddress);
  console.log("Welcome faucet added as KLT minter");

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\nDeployment complete!");
  console.log("KLT:", kltAddress);
  console.log("KLI:", kliAddress);
  console.log("MKT:", mktAddress);
  console.log("STAKING:", stakingAddress);
  console.log("FAUCET:", faucetAddress);

  // ─── Save addresses ────────────────────────────────────────────────────────
  const deployments = {
    network: "immutableTestnet",
    chainId: 13473,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      KleeblattToken: kltAddress,
      KleeblattItem: kliAddress,
      KleeblattMarketplace: mktAddress,
      KleeblattStaking: stakingAddress,
      KleeblattWelcomeFaucet: faucetAddress,
    },
  };

  const deploymentsDir = join(__dirname, "..", "deployments");
  mkdirSync(deploymentsDir, { recursive: true });
  writeFileSync(
    join(deploymentsDir, "testnet.json"),
    JSON.stringify(deployments, null, 2)
  );
  console.log("\nAddresses saved to deployments/testnet.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
