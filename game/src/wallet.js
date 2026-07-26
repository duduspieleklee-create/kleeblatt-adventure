// Wallet connection for Gala Games
export class WalletService {
  constructor() {
    this.isConnected = false;
    this.account = null;
    this.gameSession = null;
    this.galaSDK = null;
    
    // GALA mainnet = 71394, testnet = 71337 (use appropriate chain ID)
    this.chainId = 71394;
  }
  
  // Check if WalletSDK is available
  isSupported() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }
  
  // Request wallet connection
  async connect() {
    if (!this.isSupported()) {
      throw new Error('Wallet not found. Please install MetaMask or connect Coinbase Wallet.');
    }
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      // Set connected state
      this.account = accounts[0];
      this.isConnected = true;
      
      // Initialize Gala session
      await this.initGalaSession();
      
      return { success: true, account: this.account };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      if (error.code === 4001) {
        throw new Error('User rejected connection request');
      }
      throw error;
    }
  }
  
  // Disconnect wallet
  async disconnect() {
    this.isConnected = false;
    this.account = null;
    this.gameSession = null;
    return true;
  }
  
  // Initialize Gala Games SDK session
  async initGalaSession() {
    try {
      // Import Gala SDK
      const GalaSDK = await import('@gala/gala-games-defi-start-sdk');
      
      this.galaSDK = new GalaSDK();
      
      // Connect to Gala network
      this.gameSession = await this.galaSDK.connectAccount(this.account, this.chainId);
      
      return { success: true, session: this.gameSession };
    } catch (error) {
      console.error('Gala session failed:', error);
      throw error;
    }
  }
  
  // Get current account address
  getAddress() {
    return this.account;
  }
  
  // Check WALLET connection status
  getConnectedStatus() {
    const isSupported = this.isSupported();
    const isWallet = this.isConnected;
    const address = this.isConnected ? this.account.slice(0, 6) + '...' + this.account.slice(-4) : null;
    
    return {
      isSupported,
      isConnected: isWallet,
      address,
      chainId: this.chainId
    };
  }
  
  // Request specific network (Chain ID)
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      this.chainId = chainId;
      return true;
    } catch (error) {
      // Network not added, try to add it
      throw new Error('Gala network not found. Please add the network manually.');
    }
  }
  
  // Get formatted network name
  getNetworkName(chainId) {
    const networks = {
      71337: 'Gala Games Testnet',
      71394: 'Gala Games Mainnet'
    };
    return networks[chainId] || `Chain ${chainId}`;
  }
  
  // Reset wallet state
  async reset() {
    await this.disconnect();
    this.galaSDK = null;
    return true;
  }
}

// HTML helper functions for UI updates
export function updateWalletUI(connStatus) {
  const button = document.getElementById('wallet-button');
  if (button) {
    if (connStatus.isConnected) {
      button.textContent = `Connected: ${connStatus.address}`;
      button.style.backgroundColor = '#4ade80';
      button.style.cursor = 'default';
    } else if (connStatus.isSupported) {
      button.textContent = 'Connect Wallet';
      button.style.backgroundColor = '#f6416c';
      button.style.cursor = 'pointer';
    } else {
      button.textContent = 'Install MetaMask';
      button.style.backgroundColor = '#f59e0b';
      button.style.cursor = 'default';
    }
  }
}

export function showWalletStatus(status) {
  const notification = document.getElementById('wallet-notification');
  if (notification) {
    notification.textContent = status;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

export default WalletService;
