import Skeleton from "@/components/ui/Skeleton";

export default function BookingHistorySkeleton() {
  return (
    <article className="border-b pb-10">
      <div className="lg:flex lg:gap-8">

        {/* IMAGE */}
        <div className="w-full lg:w-[357px] h-[220px]">
          <Skeleton className="w-full h-full rounded-sm" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 mt-4 lg:mt-0">

          {/* TITLE + BOOKING DATE */}
          <div className="px-4 py-2 lg:flex lg:justify-between lg:items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-40" />
          </div>

          {/* CHECK IN OUT */}
          <div className="p-4 space-y-3 lg:flex lg:gap-10 lg:space-y-0">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* BOOKING DETAIL BUTTON */}
          <div className="w-full h-[56px] flex items-center justify-between px-10">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>

          {/* ACTION BUTTONS */}
          <div className="p-4 border-t flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32 rounded-sm" />
            </div>

            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </article>
  );
}