import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 p-4 md:p-6 overflow-x-auto h-full">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="min-w-[260px] w-[260px] flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: 3 - col % 2 }).map((_, card) => (
            <div key={card} className="rounded-lg border border-border p-3 space-y-2 bg-card">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
