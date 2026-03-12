import { Skeleton } from "@/components/ui/skeleton";

export function ConversationSkeleton() {
  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-6 w-14 rounded" />
            <Skeleton className="h-6 w-18 rounded" />
            <Skeleton className="h-6 w-18 rounded" />
          </div>
        </div>
        <div className="flex-1 space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3 border-b border-border/50">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 px-5 flex items-center gap-3 border-b border-border">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="flex-1 p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
              <Skeleton className={`h-12 rounded-lg ${i % 2 === 0 ? "w-60" : "w-48"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
