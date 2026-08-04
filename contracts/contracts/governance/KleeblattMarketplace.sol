// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KleeblattMarketplace
 * @notice Simple marketplace for trading Kleeblatt items on Immutable testnet
 * @dev Supports fixed-price listings and purchases
 */
contract KleeblattMarketplace is Ownable, ReentrancyGuard {
    IERC721 public itemContract;
    IERC20 public tokenContract;
    uint256 public feePercentage = 250;

    struct Listing {
        uint256 tokenId;
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;

    event Listed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event Purchased(uint256 indexed tokenId, uint256 price, address indexed buyer, address indexed seller);
    event Delisted(uint256 indexed tokenId, address indexed seller);
    event FeeWithdrawn(uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setContracts(address _itemContract, address _tokenContract) external onlyOwner {
        itemContract = IERC721(_itemContract);
        tokenContract = IERC20(_tokenContract);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high");
        feePercentage = _feePercentage;
    }

    function listItem(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        require(itemContract.ownerOf(tokenId) == msg.sender, "Not item owner");

        listings[tokenId] = Listing({
            tokenId: tokenId,
            price: price,
            seller: msg.sender,
            active: true
        });

        sellerListings[msg.sender].push(tokenId);

        itemContract.safeTransferFrom(msg.sender, address(this), tokenId);

        emit Listed(tokenId, price, msg.sender);
    }

    function purchaseItem(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerAmount = listing.price - fee;

        tokenContract.transferFrom(msg.sender, address(this), listing.price);
        tokenContract.transfer(listing.seller, sellerAmount);

        itemContract.safeTransferFrom(address(this), msg.sender, tokenId);

        listings[tokenId].active = false;

        emit Purchased(tokenId, listing.price, msg.sender, listing.seller);
    }

    function delistItem(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");

        itemContract.safeTransferFrom(address(this), msg.sender, tokenId);

        listings[tokenId].active = false;

        emit Delisted(tokenId, msg.sender);
    }

    function withdrawFees() external onlyOwner {
        uint256 bal = tokenContract.balanceOf(address(this));
        if (bal > 0) {
            tokenContract.transfer(owner(), bal);
            emit FeeWithdrawn(bal);
        }
    }
}