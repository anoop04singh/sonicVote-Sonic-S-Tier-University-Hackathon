import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-2">
          <Vote className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">SonicVote</span>
        </div>
        <Button>Connect Wallet</Button>
      </div>
    </header>
  );
};

export default Header;