import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center pt-8">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="mt-4 h-5 w-64" />
      <Skeleton className="mt-8 h-8 w-40 rounded-full" />
      <div
        className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-border"
        style={{ aspectRatio: "4/3" }}
      >
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </main>
  );
}
