import { Info } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built for the Sonic Hackathon, with love, by 0xanoop.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Note: Due to subgraph indexing, data may take up to 5 minutes to update.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;