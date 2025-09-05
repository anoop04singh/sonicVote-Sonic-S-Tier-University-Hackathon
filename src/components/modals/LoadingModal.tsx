import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  message: string;
}

export const LoadingModal = ({ isOpen, message }: LoadingModalProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-xs bg-transparent border-none shadow-none flex flex-col items-center justify-center text-white p-0">
        <div className="p-8 bg-card/80 backdrop-blur-lg rounded-lg flex flex-col items-center gap-4 shadow-2xl">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-center text-muted-foreground font-medium">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};