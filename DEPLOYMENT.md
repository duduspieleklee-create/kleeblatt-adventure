# Deployment Guide for Kleeblatt Adventure Game

## Overview

This document describes the deployment process for the Kleeblatt Adventure game, including the GalaChain contract for KleeblattCoin (KLB) tokens.

## Architecture

The game consists of:
- Frontend: Phaser 3 based 2D adventure game
- Backend: FastAPI server with PostgreSQL database
- Blockchain: GalaChain smart contract for KLB tokens

## Deployment Process

### Continuous Integration/Continuous Deployment (CI/CD)

The deployment process is automated using GitHub Actions with the following stages:

1. **Security Scanning**
   - CodeQL analysis for security vulnerabilities
   - Trivy container scanning
   - Dependency vulnerability scanning

2. **Build and Testing**
   - Install dependencies
   - Run linters
   - Execute unit tests
   - Build the GalaChain contract
   - Build Docker container

3. **Container Registry**
   - Push container to GitHub Container Registry (GHCR)

4. **Deployment**
   - Deploy to GalaChain testnet (production environment)
   - Verify deployment success

## Security Measures

### Secrets Management
- All secrets are stored in GitHub Actions encrypted secrets
- Private keys for GalaChain deployment are never exposed in logs
- API keys are rotated regularly

### Access Control
- Deployments only occur from the main branch
- Production environment requires approval
- Role-based access control for deployment permissions

## Required Secrets

The following secrets must be configured in the GitHub repository:

- `GALA_TESTNET_CREDENTIALS`: Encrypted credentials for GalaChain testnet access
- `GALA_API_URL`: API endpoint for GalaChain network
- `GALA_API_KEY`: API key for authenticating with GalaChain
- `GALA_PRIVATE_KEY`: Private key for signing transactions

## Manual Deployment

For manual deployment (not recommended for production):

1. Build the GalaChain contract:
   ```bash
   cd game-api/chaincode/kleeblattcoin
   npm install
   npm run build
   ```

2. Build the Docker image:
   ```bash
   docker build -t kleeblattcoin:latest .
   ```

3. Deploy to GalaChain (requires proper credentials):
   ```bash
   galachain deploy kleeblattcoin:latest ./path/to/private/key
   ```

## Verification

After deployment, verify the contract is working by:

1. Checking the contract is registered on the GalaChain network
2. Verifying token minting functionality
3. Confirming integration with the game backend

## Rollback Procedure

In case of deployment failure:
1. Identify the issue from the deployment logs
2. Revert to the previous stable version if necessary
3. Deploy the fix using the same CI/CD pipeline