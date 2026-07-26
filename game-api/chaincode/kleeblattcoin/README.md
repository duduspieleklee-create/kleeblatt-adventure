# KleeblattCoin GalaChain Contract

This is the GalaChain smart contract for the KleeblattCoin (KLB) token that is awarded to the top 10 daily leaderboard winners in the Kleeblatt Adventure game.

## Architecture

The contract implements a fungible token system using GalaChain's token standards:

- **Collection**: Kleeblatt
- **Category**: Coin
- **Type**: KleeblattCoin
- **Additional Key**: v1

## Setup

1. Install the GalaChain CLI globally:
   ```bash
   npm install -g @gala-chain/cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the contract:
   ```bash
   npm run build
   ```

## Deployment

### Prerequisites

- A GalaChain publisher wallet with sufficient funds for deployment
- The GalaChain CLI installed globally
- Access to the GalaChain testnet

### Steps

1. Make sure you have built the contract:
   ```bash
   npm run build
   ```

2. Deploy to the testnet:
   ```bash
   galachain deploy --network gc-testnet
   ```

3. After deployment, you will receive a chaincode URL. Update your environment variables with this URL:
   ```
   GALA_CHAINCODE_URL=https://gateway-testnet.galachain.com/api/<your-channel>/<your-chaincode-name>-KleeblattCoinContract
   ```

## Usage

Once deployed, the contract supports the following operations:

- **Mint tokens**: Add new KLB tokens to a user's balance
- **Transfer tokens**: Move tokens between users
- **Query balances**: Check a user's token balance

These operations are used by the Node.js minting service to award daily prizes to leaderboard winners.