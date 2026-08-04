import { expect } from "chai";
import { ethers } from "hardhat";

describe("KleeblattToken", function () {
  let token: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("KleeblattToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("KleeblattToken");
    expect(await token.symbol()).to.equal("KLT");
  });

  it("should mint initial supply to owner", async function () {
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseUnits("1000000", 18));
  });

  it("should allow minter to mint tokens", async function () {
    await token.addMinter(addr1.address);
    await token.connect(addr1).mint(addr1.address, ethers.parseUnits("100", 18));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseUnits("100", 18));
  });

  it("should not allow non-minter to mint", async function () {
    await expect(
      token.connect(addr1).mint(addr1.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWith("Not a minter");
  });

  it("should allow burning tokens", async function () {
    const initial = await token.balanceOf(owner.address);
    await token.burn(ethers.parseUnits("100", 18));
    expect(await token.balanceOf(owner.address)).to.equal(initial - ethers.parseUnits("100", 18));
  });

  it("should transfer tokens correctly", async function () {
    await token.transfer(addr1.address, ethers.parseUnits("100", 18));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseUnits("100", 18));
  });
});

describe("KleeblattItem", function () {
  let item: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Item = await ethers.getContractFactory("KleeblattItem");
    item = await Item.deploy(owner.address);
    await item.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await item.name()).to.equal("KleeblattItem");
    expect(await item.symbol()).to.equal("KLI");
  });

  it("should mint items to players", async function () {
    const blueprintId = ethers.id("iron_sword");
    const tx = await item.mintItem(
      addr1.address,
      blueprintId,
      0,
      1,
      "Iron Sword",
      "A sturdy iron sword",
      15
    );
    await tx.wait();

    expect(await item.ownerOf(1)).to.equal(addr1.address);
    const data = await item.getItem(1);
    expect(data.name).to.equal("Iron Sword");
    expect(data.power).to.equal(15);
  });

  it("should not allow non-owner to mint", async function () {
    await expect(
      item.connect(addr1).mintItem(
        addr1.address,
        ethers.id("test"),
        0,
        0,
        "Test",
        "Test",
        1
      )
    ).to.be.revertedWithCustomError(item, "OwnableUnauthorizedAccount");
  });

  it("should allow item owners to burn", async function () {
    await item.mintItem(addr1.address, ethers.id("test"), 0, 0, "Test", "Test", 1);
    await item.connect(addr1).burnItem(1);
    await expect(item.ownerOf(1)).to.be.reverted;
  });

  it("should allow adding stats to items", async function () {
    await item.mintItem(addr1.address, ethers.id("sword"), 0, 1, "Sword", "A sword", 10);
    await item.addItemStat(1, "attack", 15);
    await item.addItemStat(1, "speed", 8);
    expect(await item.getItemStat(1, "attack")).to.equal(15);
    expect(await item.getItemStat(1, "speed")).to.equal(8);
  });
});