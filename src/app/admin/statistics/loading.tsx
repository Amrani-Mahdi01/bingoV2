import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsLoading() {
  return (
    <>
      <Skeleton className="h-8 w-48 bg-zinc-50" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 bg-zinc-50" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-zinc-50" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 w-full bg-zinc-50" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full bg-zinc-50" />
        <Skeleton className="h-72 w-full bg-zinc-50" />
      </div>
    </>
  );
}
