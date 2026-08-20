import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("KleeblattStaking", function () {
  let token: any;
  let staking: any;
  let owner: any;
  let user1: any;
  let user2: any;

  // 10% APR: rewardRatePerSecond = 0.10 / 365 days / 1e18 (per KLT, scaled 1e18)
  // = 0.10 * 1e18 / (365 * 24 * 3600) = ~3170979198
  const REWARD_RATE = 3_170_979_198n; // ≈ 10% APR

  const parseKLT = (n: string) => ethers.parseUnits(n, 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("KleeblattToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("KleeblattStaking");
    staking = await Staking.deploy(await token.getAddress(), REWARD_RATE);
    await staking.waitForDeployment();

    // Make staking a minter so it can mint reward tokens
    await token.addMinter(await staking.getAddress());

    // Give user1 and user2 some KLT to stake
    await token.transfer(user1.address, parseKLT("10000"));
    await token.transfer(user2.address, parseKLT("5000"));
  });

  // ─── Stake ─────────────────────────────────────────────────────────────────

  it("should accept a stake and update totalStaked", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await staking.connect(user1).stake(parseKLT("1000"));

    expect(await staking.totalStaked()).to.equal(parseKLT("1000"));
    const [staked] = await staking.getPosition(user1.address);
    expect(staked).to.equal(parseKLT("1000"));
  });

  it("should revert on stake of 0", async function () {
    await expect(staking.connect(user1).stake(0)).to.be.revertedWith("Cannot stake 0");
  });

  it("should revert if allowance is insufficient", async function () {
    // No approve — should revert with ERC20 error
    await expect(
      staking.connect(user1).stake(parseKLT("1000"))
    ).to.be.reverted;
  });

  it("should track multiple stakers", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await token.connect(user2).approve(await staking.getAddress(), parseKLT("500"));
    await staking.connect(user1).stake(parseKLT("1000"));
    await staking.connect(user2).stake(parseKLT("500"));

    expect(await staking.totalStakers()).to.equal(2);
    expect(await staking.totalStaked()).to.equal(parseKLT("1500"));
  });

  // ─── Reward accrual ────────────────────────────────────────────────────────

  it("should accrue rewards over time", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await staking.connect(user1).stake(parseKLT("1000"));

    // Advance 30 days
    await time.increase(30 * 24 * 3600);

    const pending = await staking.earned(user1.address);
    // Expected: 1000 KLT * ~10% APR * (30/365) ≈ 8.22 KLT
    // Just verify it's > 0 and in the right ballpark (> 5 KLT < 15 KLT)
    expect(pending).to.be.gt(parseKLT("5"));
    expect(pending).to.be.lt(parseKLT("15"));
  });

  it("earned should return 0 before any stake", async function () {
    expect(await staking.earned(user1.address)).to.equal(0);
  });

  // ─── Claim ─────────────────────────────────────────────────────────────────

  it("should transfer rewards on claim", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await staking.connect(user1).stake(parseKLT("1000"));

    await time.increase(365 * 24 * 3600); // 1 year ≈ 10% APR

    const balBefore = await token.balanceOf(user1.address);
    await staking.connect(user1).claim();
    const balAfter = await token.balanceOf(user1.address);

    const received = balAfter - balBefore;
    // ~10% of 1000 KLT = 100 KLT — allow ±5% tolerance
    expect(received).to.be.gt(parseKLT("90"));
    expect(received).to.be.lt(parseKLT("110"));
  });

  it("should reset pending rewards to 0 after claim", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await staking.connect(user1).stake(parseKLT("1000"));
    await time.increase(3600);
    await staking.connect(user1).claim();

    // Pending should be near-zero immediately after claim
    // (1 block may have passed adding tiny accrual)
    const pending = await staking.earned(user1.address);
    expect(pending).to.be.lt(parseKLT("0.01"));
  });

  // ─── Unstake ───────────────────────────────────────────────────────────────

  it("should return staked KLT on unstake", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("1000"));
    await staking.connect(user1).stake(parseKLT("1000"));

    const balBefore = await token.balanceOf(user1.address);
    await staking.connect(user1).unstake(parseKLT("1000"));
    const balAfter = await token.balanceOf(user1.address);

    // Should receive staked amount + rewards (reward > 0 even for 1 block)
    expect(balAfter).to.be.gte(balBefore + parseKLT("1000"));
  });

  it("should revert unstake more than staked", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("100"));
    await staking.connect(user1).stake(parseKLT("100"));
    await expect(
      staking.connect(user1).unstake(parseKLT("101"))
    ).to.be.revertedWith("Insufficient staked balance");
  });

  it("should decrement totalStakers on full unstake", async function () {
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("100"));
    await staking.connect(user1).stake(parseKLT("100"));
    expect(await staking.totalStakers()).to.equal(1);
    await staking.connect(user1).unstake(parseKLT("100"));
    expect(await staking.totalStakers()).to.equal(0);
  });

  // ─── Owner ─────────────────────────────────────────────────────────────────

  it("should allow owner to update reward rate", async function () {
    const newRate = 6_341_958_396n; // ~20% APR
    await staking.setRewardRate(newRate);
    expect(await staking.rewardRatePerSecond()).to.equal(newRate);
  });

  it("should not allow non-owner to update rate", async function () {
    await expect(
      staking.connect(user1).setRewardRate(0)
    ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
  });

  it("should allow funding the reward pool", async function () {
    await token.approve(await staking.getAddress(), parseKLT("5000"));
    await staking.fundRewards(parseKLT("5000"));
    expect(await staking.rewardPool()).to.equal(parseKLT("5000"));
  });

  // ─── getPool view ──────────────────────────────────────────────────────────

  it("getPool should return APR in basis points", async function () {
    const [, , apr] = await staking.getPool();
    // REWARD_RATE ≈ 10% APR → apr ≈ 1000 bp (allow ±50 for rounding)
    expect(apr).to.be.gte(950n);
    expect(apr).to.be.lte(1050n);
  });

  // ─── Pause ─────────────────────────────────────────────────────────────────

  it("should revert stake when paused", async function () {
    await staking.pause();
    await token.connect(user1).approve(await staking.getAddress(), parseKLT("100"));
    await expect(staking.connect(user1).stake(parseKLT("100"))).to.be.revertedWithCustomError(
      staking,
      "EnforcedPause"
    );
  });
});
