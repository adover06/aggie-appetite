import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function RecipesLoading() {
  return (
    <main>
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
