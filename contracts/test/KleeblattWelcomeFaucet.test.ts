import { expect } from "chai";
import { ethers } from "hardhat";

describe("KleeblattWelcomeFaucet", function () {
  let token: any;
  let faucet: any;
  let owner: any;
  let gameCaller: any;
  let player1: any;
  let player2: any;

  const BONUS = ethers.parseUnits("100", 18);

  beforeEach(async function () {
    [owner, gameCaller, player1, player2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("KleeblattToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    const Faucet = await ethers.getContractFactory("KleeblattWelcomeFaucet");
    faucet = await Faucet.deploy(await token.getAddress(), gameCaller.address);
    await faucet.waitForDeployment();

    // Grant faucet minter rights on KLT
    await token.addMinter(await faucet.getAddress());
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  it("should send exactly 100 KLT to the recipient", async function () {
    const balBefore = await token.balanceOf(player1.address);
    await faucet.connect(gameCaller).claimFor(player1.address);
    const balAfter = await token.balanceOf(player1.address);
    expect(balAfter - balBefore).to.equal(BONUS);
  });

  it("should emit WelcomeBonusClaimed", async function () {
    await expect(faucet.connect(gameCaller).claimFor(player1.address))
      .to.emit(faucet, "WelcomeBonusClaimed")
      .withArgs(player1.address);
  });

  it("should mark recipient as claimed", async function () {
    await faucet.connect(gameCaller).claimFor(player1.address);
    expect(await faucet.claimed(player1.address)).to.be.true;
  });

  it("canClaim returns true before and false after", async function () {
    expect(await faucet.canClaim(player1.address)).to.be.true;
    await faucet.connect(gameCaller).claimFor(player1.address);
    expect(await faucet.canClaim(player1.address)).to.be.false;
  });

  it("different players can each claim once", async function () {
    await faucet.connect(gameCaller).claimFor(player1.address);
    await faucet.connect(gameCaller).claimFor(player2.address);
    expect(await token.balanceOf(player1.address)).to.equal(BONUS);
    expect(await token.balanceOf(player2.address)).to.equal(BONUS);
  });

  // ─── Once-only guard ───────────────────────────────────────────────────────

  it("should revert on a second claim for the same address", async function () {
    await faucet.connect(gameCaller).claimFor(player1.address);
    await expect(
      faucet.connect(gameCaller).claimFor(player1.address)
    ).to.be.revertedWith("Already claimed");
  });

  // ─── Access control ────────────────────────────────────────────────────────

  it("should revert if called by a non-gameCaller address", async function () {
    await expect(
      faucet.connect(player1).claimFor(player1.address)
    ).to.be.revertedWith("Not authorised");
  });

  it("should revert if called by the owner when owner != gameCaller", async function () {
    await expect(
      faucet.connect(owner).claimFor(player1.address)
    ).to.be.revertedWith("Not authorised");
  });

  // ─── Pause ─────────────────────────────────────────────────────────────────

  it("should revert when faucet is paused", async function () {
    await faucet.setActive(false);
    await expect(
      faucet.connect(gameCaller).claimFor(player1.address)
    ).to.be.revertedWith("Faucet is paused");
  });

  it("canClaim returns false when paused", async function () {
    await faucet.setActive(false);
    expect(await faucet.canClaim(player1.address)).to.be.false;
  });

  it("should allow claims again after unpausing", async function () {
    await faucet.setActive(false);
    await faucet.setActive(true);
    await faucet.connect(gameCaller).claimFor(player1.address);
    expect(await token.balanceOf(player1.address)).to.equal(BONUS);
  });

  // ─── Owner rotation ────────────────────────────────────────────────────────

  it("owner can rotate gameCaller", async function () {
    await faucet.setGameCaller(player2.address);
    expect(await faucet.gameCaller()).to.equal(player2.address);
    // Old caller no longer works
    await expect(
      faucet.connect(gameCaller).claimFor(player1.address)
    ).to.be.revertedWith("Not authorised");
    // New caller works
    await faucet.connect(player2).claimFor(player1.address);
    expect(await token.balanceOf(player1.address)).to.equal(BONUS);
  });

  it("non-owner cannot rotate gameCaller", async function () {
    await expect(
      faucet.connect(player1).setGameCaller(player2.address)
    ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");
  });

  it("should revert on zero-address recipient", async function () {
    await expect(
      faucet.connect(gameCaller).claimFor(ethers.ZeroAddress)
    ).to.be.revertedWith("Zero address");
  });
});
