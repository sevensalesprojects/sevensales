import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2 bg-card">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-lg border border-border p-4 bg-card">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-64 w-full rounded" />
      </div>
    </div>
  );
}
