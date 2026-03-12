import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 min-h-[200px]">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        {icon || <Inbox className="w-6 h-6 text-muted-foreground" />}
      </div>
      <p className="text-sm font-medium text-foreground text-center">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
