import { BrowserConnectClient } from '@gala-chain/connect';

export class WalletService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.account = null;
    this.galaAddress = null;
  }

  isSupported() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error('Wallet not found. Please install MetaMask or compatible wallet.');
    }

    try {
      this.client = new BrowserConnectClient();
      this.galaAddress = await this.client.connect();
      this.account = this.client.ethereumAddress;
      this.isConnected = true;

      this.client.on('accountChanged', (address) => {
        if (address) {
          this.account = this.client.ethereumAddress;
          this.galaAddress = address;
          this.isConnected = true;
        } else {
          this.account = null;
          this.galaAddress = null;
          this.isConnected = false;
        }
      });

      return { success: true, account: this.account };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('User rejected connection request');
      }
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
    this.isConnected = false;
    this.account = null;
    this.galaAddress = null;
    this.client = null;
    return true;
  }

  getAddress() {
    return this.account;
  }

  getGalaAddress() {
    return this.galaAddress;
  }

  getConnectedStatus() {
    const isSupported = this.isSupported();
    const isWallet = this.isConnected;
    const address = this.isConnected
      ? this.account.slice(0, 6) + '...' + this.account.slice(-4)
      : null;

    return {
      isSupported,
      isConnected: isWallet,
      address,
    };
  }
}

export default WalletService;
