// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KleeblattItem
 * @notice ERC721 NFT representing in-game items for Kleeblatt Adventure
 * @dev Items have types (weapon, armor, potion, etc.) and rarities (common, rare, epic, legendary)
 */
contract KleeblattItem is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    enum ItemType {
        WEAPON,
        ARMOR,
        POTION,
        MATERIAL,
        PET,
        LAND
    }

    enum Rarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY
    }

    struct ItemData {
        ItemType itemType;
        Rarity rarity;
        string name;
        string description;
        uint256 power;
        uint256 statsLength;
    }

    struct StatEntry {
        string name;
        uint256 value;
    }

    mapping(uint256 => ItemData) private _items;
    mapping(uint256 => StatEntry[]) private _itemStats;
    mapping(bytes32 => uint256[]) private _itemBlueprints;

    event ItemMinted(address indexed to, uint256 indexed tokenId, bytes32 blueprintId);
    event ItemTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event ItemBurned(uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("KleeblattItem", "KLI") Ownable(initialOwner) {}

    function mintItem(
        address to,
        bytes32 blueprintId,
        ItemType itemType,
        Rarity rarity,
        string memory name,
        string memory description,
        uint256 power
    ) external onlyOwner returns (uint256) {
        uint256 newTokenId = _nextTokenId++;

        _safeMint(to, newTokenId);

        ItemData storage item = _items[newTokenId];
        item.itemType = itemType;
        item.rarity = rarity;
        item.name = name;
        item.description = description;
        item.power = power;

        _itemBlueprints[blueprintId].push(newTokenId);

        emit ItemMinted(to, newTokenId, blueprintId);
        emit ItemTransferred(newTokenId, address(0), to);

        return newTokenId;
    }

    function addItemStat(uint256 tokenId, string memory statName, uint256 value) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Item does not exist");
        _itemStats[tokenId].push(StatEntry(statName, value));
        _items[tokenId].statsLength = _itemStats[tokenId].length;
    }

    function getItem(uint256 tokenId) external view returns (ItemData memory) {
        require(ownerOf(tokenId) != address(0), "Item does not exist");
        return _items[tokenId];
    }

    function getItemStat(uint256 tokenId, string memory statName) external view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Item does not exist");
        StatEntry[] storage stats = _itemStats[tokenId];
        for (uint256 i = 0; i < stats.length; i++) {
            if (keccak256(abi.encodePacked(stats[i].name)) == keccak256(abi.encodePacked(statName))) {
                return stats[i].value;
            }
        }
        return 0;
    }

    function getItemStats(uint256 tokenId) external view returns (StatEntry[] memory) {
        require(_ownerOf(tokenId) != address(0), "Item does not exist");
        return _itemStats[tokenId];
    }

    function getItemsByBlueprint(bytes32 blueprintId) external view returns (uint256[] memory) {
        return _itemBlueprints[blueprintId];
    }

    function burnItem(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "Not item owner");
        _burn(tokenId);
        emit ItemBurned(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return string(abi.encodePacked("https://game.kleeblatt.space/api/items/", tokenId));
    }
}