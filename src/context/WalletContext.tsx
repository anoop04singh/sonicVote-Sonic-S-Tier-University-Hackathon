import React, { createContext, useContext, useState, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = () => {
    // Mock connection
    setTimeout(() => {
      const mockAddress = "So1...aBcD";
      setAddress(mockAddress);
      setIsConnected(true);
      showSuccess("Wallet connected successfully!");
    }, 500);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    showError("Wallet disconnected.");
  };

  return (
    <WalletContext.Provider value={{ isConnected, address, connectWallet, disconnectWallet }}>
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