import { useState } from "react";
import { Link } from "react-router-dom";
import { Vote, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { useWallet } from "@/context/WalletContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected, address, disconnectWallet } = useWallet();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Vote className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">SonicVote</span>
          </Link>
          
          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-auto justify-start space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${address}`} alt="Avatar" />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-muted-foreground">Wallet Connected</span>
                    <span className="text-sm font-bold">{`${address.substring(0, 4)}...${address.substring(address.length - 4)}`}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-card/90 backdrop-blur-lg border border-border/40 shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${address}`} alt="Avatar" />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 overflow-hidden">
                      <p className="text-base font-medium leading-none">My Account</p>
                      <p className="text-sm leading-none text-muted-foreground truncate">
                        {address}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem asChild className="cursor-pointer text-base p-3 focus:bg-accent/50">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-3 h-5 w-5 text-primary" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-base p-3 text-red-400 focus:bg-red-900/50 focus:text-red-300">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setWalletModalOpen(true)}>Connect Wallet</Button>
          )}
        </div>
      </header>
      {!isConnected && <ConnectWalletModal isOpen={isWalletModalOpen} onOpenChange={setWalletModalOpen} />}
    </>
  );
};

export default Header;