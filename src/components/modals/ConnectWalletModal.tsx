import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const wallets = [
  { name: "Phantom", icon: <Wallet className="h-6 w-6" /> },
  { name: "Solflare", icon: <Wallet className="h-6 w-6" /> },
  { name: "MetaMask", icon: <Wallet className="h-6 w-6" /> },
];

export const ConnectWalletModal = ({ isOpen, onOpenChange }: ConnectWalletModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to SonicVote.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          {wallets.map((wallet) => (
            <Button key={wallet.name} variant="outline" className="w-full justify-start text-lg p-6">
              <div className="mr-4">{wallet.icon}</div>
              {wallet.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};