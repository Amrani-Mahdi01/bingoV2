import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersLoading() {
  return (
    <>
      <Skeleton className="h-8 w-48 bg-zinc-50" />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full bg-zinc-50" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-zinc-50" />
        ))}
      </div>
    </>
  );
}
