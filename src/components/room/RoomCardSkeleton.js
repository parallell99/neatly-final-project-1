import Skeleton from "@/components/ui/Skeleton";

export default function RoomCardSkeleton() {
  return (
    <article className="grid grid-cols-1 md:grid-cols-[460px_1fr_280px] gap-10 py-12 px-6 border-b border-gray-200 items-start">
      {/* Image */}
      <div className="relative w-full h-[300px]">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      {/* Content */}
      <div>
        <Skeleton className="h-7 w-2/3 mb-4" />
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-11/12 mb-2" />
        <Skeleton className="h-4 w-10/12" />
      </div>

      {/* Price */}
      <div className="flex flex-col items-start md:items-end">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-40 mb-6" />

        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </article>
  );
}

