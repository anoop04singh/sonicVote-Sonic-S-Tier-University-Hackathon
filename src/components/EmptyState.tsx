import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState = ({
  title = "No data found",
  description = "There are no items to display at the moment."
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg bg-card/30 border border-dashed">
      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
};