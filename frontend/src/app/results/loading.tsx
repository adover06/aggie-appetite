import { Skeleton, SkeletonItemList } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <main>
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8">
        <SkeletonItemList />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    </main>
  );
}
