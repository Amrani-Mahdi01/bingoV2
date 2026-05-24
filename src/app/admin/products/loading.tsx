import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <>
      <Skeleton className="h-8 w-48 bg-zinc-50" />
      <Skeleton className="mt-2 h-4 w-64 bg-zinc-50" />
      <Skeleton className="mt-6 h-14 w-full bg-zinc-50" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-zinc-50" />
        ))}
      </div>
    </>
  );
}
