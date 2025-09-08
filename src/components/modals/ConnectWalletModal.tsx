import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWallet } from "@/context/WalletContext";
import { Wallet } from "lucide-react";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const wallets = [
  { name: "MetaMask", id: "metamask", icon: <Wallet className="h-6 w-6 text-orange-500" /> },
  { name: "Coinbase Wallet", id: "coinbase", icon: <Wallet className="h-6 w-6 text-blue-500" /> },
  { name: "WalletConnect", id: "walletconnect", icon: <Wallet className="h-6 w-6 text-blue-400" /> },
  { name: "Safe", id: "safe", icon: <Wallet className="h-6 w-6 text-green-500" /> },
];

export const ConnectWalletModal = ({ isOpen, onOpenChange }: ConnectWalletModalProps) => {
  const { connectWallet } = useWallet();
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      setIsMetaMaskInstalled(true);
    }
  }, []);

  const handleConnect = () => {
    // The current connection logic is tied to window.ethereum (MetaMask).
    connectWallet();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/40">
        <DialogHeader className="text-center pt-2">
          <DialogTitle className="text-xl">Connect your wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-3 py-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="w-full justify-between text-lg p-6 h-16 border-border/50 hover:bg-accent/50"
              onClick={handleConnect}
              // Since we only support MetaMask via window.ethereum, we disable other options for now.
              disabled={wallet.id !== 'metamask' && !isMetaMaskInstalled}
            >
              <div className="flex items-center">
                <div className="mr-4">{wallet.icon}</div>
                {wallet.name}
              </div>
              {wallet.id === 'metamask' && isMetaMaskInstalled && (
                <span className="text-sm text-muted-foreground">Installed</span>
              )}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            By connecting a wallet, you agree to SonicVote's{" "}
            <a href="#" className="underline hover:text-primary">Terms of Service</a> and{" "}
            <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};