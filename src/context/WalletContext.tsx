import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ethers, BrowserProvider, Signer } from 'ethers';
import { showSuccess, showError } from '@/utils/toast';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      showError("MetaMask is not installed. Please install it to connect.");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await browserProvider.getSigner();
      const walletAddress = await signerInstance.getAddress();

      setProvider(browserProvider);
      setSigner(signerInstance);
      setAddress(walletAddress);
      setIsConnected(true);
      showSuccess("Wallet connected successfully!");

      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      showError("Failed to connect wallet. Please check the console.");
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('walletConnected');
    showError("Wallet disconnected.");
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (address !== accounts[0]) {
        connectWallet(); // Re-connect with the new account
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // Auto-reconnect if previously connected
    if (localStorage.getItem('walletConnected') === 'true') {
      connectWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);


  return (
    <WalletContext.Provider value={{ isConnected, address, provider, signer, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};