# GalaChain Smart Contract Deployment Guide (SDK v3.1.4 Compliant)

This guide provides step-by-step instructions to deploy the KleeblattCoin smart contract to the GalaChain testnet from the server, aligned with GalaChain SDK v3.1.4 documentation.

## Prerequisites

Before starting the deployment, ensure that:

1. You have SSH access to the server at `57.130.64.126` with user `debian` and password `fred1988`
2. The `GALA_PRIVATE_KEY` is stored in GitHub secrets (already done)
3. You have GalaChain CLI installed on the server
4. Your publisher wallet has sufficient funds for deployment
5. You have the GalaChain SDK v3.1.4 installed with all dependencies

## Step-by-Step Server Deployment Instructions

### 1. Connect to the Server

Connect to your server using SSH:

```bash
ssh debian@57.130.64.126
```

Enter the password: `fred1988`

### 2. Switch to Root User

Once connected, switch to the root user:

```bash
sudo su
```

### 3. Navigate to the Chaincode Directory

Navigate to the chaincode directory:

```bash
cd /opt/game-api/chaincode
```

### 4. Install/Verify GalaChain CLI

Make sure you have the latest version of the GalaChain CLI installed:

```bash
npm install -g @gala-chain/cli@3.1.4
```

Verify the installation:
```bash
galachain --version
```

### 5. Navigate to the KleeblattCoin Contract Directory

Go to the KleeblattCoin contract directory:

```bash
cd kleeblattcoin
```

### 6. Install Dependencies

Install the required dependencies according to the SDK documentation:

```bash
npm install
```

### 7. Build the Contract

Build the contract to ensure it compiles correctly (following SDK v3.1.4 standards):

```bash
npm run build
```

### 8. Verify Environment Variables

Ensure the environment variables are properly set with your GalaChain secrets:

```bash
cat .env
```

You should see something like:
```
GALA_PRIVATE_KEY=your_encrypted_private_key_here
GALA_CHAINCODE_URL=your_chaincode_url
GALA_REST_API=https://gateway-testnet.galachain.com/api
PORT=8002
```

### 9. Prepare for Deployment

According to the GalaChain SDK v3.1.4 documentation, ensure your contract meets the following requirements:
- All contracts must extend from GalaContract
- Proper TypeScript compilation with decorators enabled
- Valid chaincode metadata configuration

### 10. Deploy the Contract to GalaChain Testnet

Deploy the contract to the GalaChain testnet using the documented command:

```bash
galachain deploy --network gc-testnet --verbose
```

The `--verbose` flag will provide detailed output to help troubleshoot any deployment issues.

### 11. Alternative Deployment Method (if direct deploy fails)

If the direct deployment fails, follow the manual deployment process as per SDK documentation:

1. Create a deployment package:
```bash
galachain package
```

2. Deploy the packaged chaincode:
```bash
galachain deploy-package --network gc-testnet --package-path ./dist/chaincode.tar.gz
```

### 12. Capture the Deployment Information

After successful deployment, the CLI will output the chaincode URL and transaction ID. You'll need to update your environment variables with this URL. The format will be:

```
https://gateway-testnet.galachain.com/api/<channel>/<chaincode-name>-KleeblattCoinContract
```

Take note of the channel name and chaincode name from the deployment output.

### 13. Update the Environment File

Update the `.env` file with the new chaincode URL:

```bash
nano .env
```

Update the `GALA_CHAINCODE_URL` value with the URL returned from the deployment.

### 14. Restart the Chaincode Service

Restart the chaincode service to pick up the new environment variables:

```bash
systemctl restart kleeblatt-chaincode
```

### 15. Verify Service Status

Check that the service is running correctly:

```bash
systemctl status kleeblatt-chaincode
```

### 16. Test the Connection

Test that the Node.js service can connect to the chaincode:

```bash
curl http://localhost:8002/health
```

You should see a response indicating the service is healthy and connected to the chaincode.

### 17. Verify Contract Deployment

Verify that your contract is properly deployed by checking the chaincode info:

```bash
galachain info --network gc-testnet --contract KleeblattCoinContract
```

### 18. Update GitHub Secrets (if needed)

If the chaincode URL has changed, update the `GALA_CHAINCODE_URL` secret in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Update the `GALA_CHAINCODE_URL` secret with the new URL

## Verification Using GalaChain SDK Methods

To verify the deployment worked correctly according to SDK documentation:

1. Check that the daily award system is functioning by examining the logs:
   ```bash
   journalctl -u daily-awards -f
   ```

2. Verify that the Node.js chaincode service is running:
   ```bash
   curl http://localhost:8002/health
   ```

3. Test minting functionality using the SDK-compliant endpoints (this will only work if the chaincode is properly deployed):
   ```bash
   curl -X POST http://localhost:8002/mint-coins \
     -H "Content-Type: application/json" \
     -d '{"walletAddress":"0x1234567890123456789012345678901234567890","rank":1}'
   ```

4. Verify the token was minted by querying the balance:
   ```bash
   curl -X POST http://localhost:8002/leaderpoints
   ```

## Troubleshooting Based on SDK Documentation

If you encounter issues during deployment:

1. **Connection Issues**: Verify your GalaChain network access and credentials. Check that the network alias `gc-testnet` is properly configured in your CLI.

2. **Insufficient Funds**: Ensure your publisher wallet has sufficient GCAT tokens for deployment fees. You can check your balance with:
   ```bash
   galachain balance --network gc-testnet --address YOUR_PUBLISHER_ADDRESS
   ```

3. **Build Errors**: Ensure TypeScript compilation succeeds with ES2020 target and decorator support. Check that all GalaChain SDK dependencies are at v3.1.4.

4. **Service Not Starting**: Check the service logs with `journalctl -u kleeblatt-chaincode` and ensure the environment variables are correctly set.

5. **Contract Validation Errors**: Make sure your contract follows GalaChain SDK v3.1.4 standards:
   - Proper inheritance from GalaContract
   - Correct TypeScript decorators
   - Valid chaincode metadata

## Rollback

If you need to rollback:

1. Stop the service: `systemctl stop kleeblatt-chaincode`
2. Revert to the previous version if available
3. Restart the service: `systemctl start kleeblatt-chaincode`

## Compliance with GalaChain SDK v3.1.4

This deployment follows the GalaChain SDK v3.1.4 standards:

- Contract properly extends GalaContract base class
- Uses the latest token standards for fungible tokens
- Implements proper error handling as per SDK documentation
- Follows the recommended project structure
- Uses TypeScript with proper decorator support
- Includes proper metadata for chaincode identification

## Notes

- The deployment creates the KleeblattCoin fungible token contract compliant with GalaChain v3.1.4
- The contract supports minting tokens for daily leaderboard winners using SDK-standard methods
- Tokens are awarded based on rank (1st place gets 100 KLB, 2nd gets 80 KLB, etc.)
- The daily award system runs automatically via the systemd timer
- The contract uses the proper token class structure: collection: Kleeblatt, category: Coin, type: KleeblattCoin, additionalKey: v1