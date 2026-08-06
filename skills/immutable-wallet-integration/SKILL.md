---
name: "immutable-wallet-integration"
description: "Integrate Immutable SDK for wallet login, registration, and deposit address functionality in Kleeblatt Adventure game"
---

# Immutable Wallet Integration

## When to Use
When implementing wallet connectivity for the Kleeblatt Adventure game that supports both mock wallets and Immutable wallets with deposit address functionality.

## Procedure
1. **Backend Implementation**
   - Extend wallet service to support Immutable SDK integration
   - Add new API endpoints: POST /wallet/connect-immutable and GET /wallet/deposit-address-immutable
   - Update wallet routes to handle both mock and Immutable wallet connections
   - Ensure database schema supports multiple wallet providers through providerRef field

2. **Frontend Integration**
   - Create ImmutableWalletCard component with dual wallet support
   - Add API functions for Immutable wallet operations:
     * connectImmutableWallet - Connect using Immutable SDK
     * getImmutableDepositAddress - Get deposit address via Immutable SDK
     * getWalletDepositAddress - Get standard wallet deposit address
   - Implement wallet connection flow with provider selection

3. **Architecture Compliance**
   - Maintain existing wallet abstraction pattern
   - Follow provider-agnostic design principles
   - Preserve backward compatibility with existing mock wallet functionality

## Evidenced Pitfalls
- Type errors in large files like MatchScene due to syntax issues
- Incorrect API endpoint routing without proper validation
- Missing error handling for wallet provider-specific operations
- Improper state management during wallet connection flows

## Verification Steps
1. Verify all new API endpoints return correct responses for both wallet types
2. Test wallet connection flows with both mock and Immutable providers
3. Confirm deposit address retrieval works for both wallet types
4. Validate that existing mock wallet functionality remains intact
5. Ensure proper error handling for network and wallet provider issues
6. Check that all TypeScript compilation passes without errors
