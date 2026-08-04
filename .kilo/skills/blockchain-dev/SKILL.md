---
name: blockchain-dev
description: "Blockchain and smart contract specialist for Kleeblatt Adventure on Immutable testnet. Use for Solidity contracts, Hardhat deployment, @imtbl/sdk integration, NFT minting, marketplace logic, token economics, and on-chain game mechanics."
version: 0.1.0
---

# Blockchain Development for Kleeblatt Adventure

Specialist for Immutable zkEVM testnet development, Solidity smart contracts, and Web3 integration for the Kleeblatt Adventure game.

## Project Context

Kleeblatt Adventure runs on Immutable testnet (chainId: 13371) with:
- **Hardhat** toolchain at `/opt/kleeblatt-adventure/contracts/`
- **Solidity 0.8.24** with OpenZeppelin 5.x
- **Ethers.js v6** for contract interaction
- **@imtbl/sdk** for wallet management and Immutable-specific features

## Contract Architecture

### Core Contracts
- **KleeblattToken (KLT)** - ERC20 governance token with minting/burning
- **KleeblattItem (KLI)** - ERC721 NFT for in-game items with stats system
- **KleeblattMarketplace** - Fixed-price marketplace for item trading

### Contract Locations
- `/opt/kleeblatt-adventure/contracts/contracts/tokens/KleeblattToken.sol`
- `/opt/kleeblatt-adventure/contracts/contracts/items/KleeblattItem.sol`
- `/opt/kleeblatt-adventure/contracts/contracts/governance/KleeblattMarketplace.sol`

## Development Workflow

### 1. Contract Development
```bash
cd /opt/kleeblatt-adventure/contracts
npx hardhat compile      # Compile contracts
npx hardhat test         # Run tests
```

### 2. Deployment
```bash
export IMX_TESTNET_PRIVATE_KEY="0x..."
npx hardhat deploy --network immutableTestnet
```

### 3. Contract Interaction
```bash
# Mint test item
npx hardhat mint-item --network immutableTestnet --to 0x... --name "Iron Sword" --rarity 1 --power 15

# Mint test tokens
npx hardhat mint-tokens --network immutableTestnet --to 0x... --amount 100
```

## Immutable Testnet Configuration

### Network Details
- **Chain ID**: 13371
- **RPC**: `https://rpc.testnet.immutable.com`
- **Explorer**: `https://imxscan.com` (testnet)
- **Faucet**: `https://portal.immutable.com/testnet`

### Required Environment Variables
```bash
IMX_TESTNET_RPC=https://rpc.testnet.immutable.com
IMX_TESTNET_PRIVATE_KEY=0x...  # Deployer wallet
ETHERSCAN_API_KEY=...          # For contract verification
ITEM_CONTRACT_ADDRESS=0x...    # Deployed KleeblattItem
TOKEN_CONTRACT_ADDRESS=0x...   # Deployed KleeblattToken
```

## Security Best Practices

1. **Always use OpenZeppelin contracts** - Never roll your own ERC implementations
2. **ReentrancyGuard** on all external functions that modify state
3. **Ownable** access control for admin functions
4. **Events** for all state changes (minting, transfers, marketplace actions)
5. **Input validation** - Check all user inputs before processing
6. **Safe transfers** - Use `safeTransferFrom` for ERC721, check return values for ERC20
7. **Gas optimization** - Use `unchecked` blocks where safe, pack storage variables

## Integration Points

### Game Bridge Events
- `item:minted` - New NFT minted for player
- `item:burned` - NFT destroyed
- `token:transferred` - Token movement detected
- `marketplace:list` - Item listed for sale
- `marketplace:sale` - Item purchased

### API Endpoints
- `GET /api/contracts` - Contract addresses and ABI
- `POST /api/contracts/mint` - Mint item via API
- `GET /api/contracts/balance` - Token balance
- `GET /api/contracts/items/:tokenId` - Item metadata

## Testing

### Test Structure
```
contracts/test/
├── KleeblattToken.test.ts
├── KleeblattItem.test.ts
└── KleeblattMarketplace.test.ts
```

### Test Requirements
- All contracts must have 100% function coverage
- Test both success and failure cases
- Test access control (onlyOwner, onlyMinter)
- Test edge cases (zero values, max values, reentrancy)
- Use Hardhat's `ethers` fixture pattern

## Common Patterns

### ERC721 Item Minting
```solidity
function mintItem(address to, bytes32 blueprintId, ...) external onlyOwner {
    uint256 newTokenId = _nextTokenId++;
    _safeMint(to, newTokenId);
    // Set item data
    emit ItemMinted(to, newTokenId, blueprintId);
}
```

### Marketplace Listing
```solidity
function listItem(uint256 tokenId, uint256 price) external nonReentrant {
    require(itemContract.ownerOf(tokenId) == msg.sender);
    itemContract.safeTransferFrom(msg.sender, address(this), tokenId);
    listings[tokenId] = Listing({price, seller: msg.sender, active: true});
}
```

### Token Minting
```solidity
function mint(address to, uint256 amount) external {
    require(minters[msg.sender], "Not a minter");
    _mint(to, amount);
    emit TokensMinted(to, amount);
}
```

## Deployment Checklist

1. [ ] All tests passing
2. [ ] Contracts compiled without warnings
3. [ ] Gas optimization reviewed
4. [ ] Access control verified
5. [ ] Events emitted for all state changes
6. [ ] Testnet deployment successful
7. [ ] Contract verification submitted
8. [ ] Environment variables updated
9. [ ] API integration tested
10. [ ] Game bridge events wired

## Troubleshooting

### Common Issues
- **`mcopy` errors**: Add `evmVersion: "cancun"` to Hardhat config
- **`balance` conflicts**: Don't use `balance` as variable name (Solidity builtin)
- **OpenZeppelin imports**: Use `@openzeppelin/contracts/` not `openzeppelin-solidity/`
- **Test failures**: Ensure proper fixture pattern with `beforeEach`
- **Deployment failures**: Check RPC connectivity and gas limits

### Debug Commands
```bash
# Check contract state
npx hardhat console --network immutableTestnet
> const item = await ethers.getContractAt("KleeblattItem", "0x...")
> await item.getItem(1)

# Check token balance
> const token = await ethers.getContractAt("KleeblattToken", "0x...")
> await token.balanceOf("0x...")
```

## References

- [Immutable Documentation](https://docs.immutable.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Solidity Documentation](https://docs.soliditylang.org/)