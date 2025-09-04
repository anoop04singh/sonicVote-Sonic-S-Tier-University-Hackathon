import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ethers, BrowserProvider, Signer } from 'ethers';
import { showSuccess, showError } from '@/utils/toast';
import { sonicNetwork } from '@/config/network';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const switchNetwork = async () => {
  if (!window.ethereum) throw new Error("No crypto wallet found");
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: sonicNetwork.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: sonicNetwork.chainId,
              chainName: sonicNetwork.chainName,
              rpcUrls: sonicNetwork.rpcUrls,
              nativeCurrency: sonicNetwork.nativeCurrency,
              blockExplorerUrls: sonicNetwork.blockExplorerUrls,
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Sonic network:", addError);
        throw new Error("Failed to add Sonic network to your wallet.");
      }
    } else {
      console.error("Failed to switch network:", switchError);
      throw new Error("Failed to switch to the Sonic network.");
    }
  }
};

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
      await switchNetwork();

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await browserProvider.getSigner();
      const walletAddress = await signerInstance.getAddress();

      setProvider(browserProvider);
      setSigner(signerInstance);
      setAddress(walletAddress);
      setIsConnected(true);
      showSuccess("Wallet connected successfully!");

      localStorage.setItem('walletConnected', 'true');
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      if (error.code === 4001) {
        showError("Connection request was rejected by the user.");
      } else {
        showError(error.message || "Failed to connect wallet.");
      }
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
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    if (localStorage.getItem('walletConnected') === 'true') {
      connectWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
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