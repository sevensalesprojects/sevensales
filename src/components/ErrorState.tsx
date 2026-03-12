import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
