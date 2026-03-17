"use client";

import React from "react";
import Skeleton from "@/components/ui/Skeleton";
import Hotel from "@/assets/icons/hotel.svg"
import Check from "@/assets/icons/check.svg"
import RightDirection from "@/assets/icons/direction-right.svg"

/**
 * @param {Object} props
 * @param {{ checkIn: { label: string, time: string, description: string }, checkOut: { label: string, time: string, description: string } } | null} props.data
 * @param {boolean} props.loading
 */
function CheckInCheckOutTimesCard({ data, loading }) {
  const checkIn = data?.checkIn;
  const checkOut = data?.checkOut;

  console.log(checkIn)
  console.log(checkOut)

  return (
    <article
      className="flex flex-col gap-[24px]"
      aria-labelledby="checkin-checkout-averages-title"
    >

      <h5 className="headline-5 text-gray-600">
        Check-in and Check-out Times Averages
      </h5>

      {loading ? (
        <div
          className="grid gap-3"
          aria-busy="true"
          aria-label="Loading check-in and check-out averages"
        >
          <CheckCardSkeleton />
          <CheckCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-[16px] lg:grid-cols-2">
          {/* Check-in card */}
          <section
            className="flex items-center  justify-between rounded-[16px] px-[12px] lg:px-[24px] py-[16px] bg-green-100"
          >
            <div className="flex items-center w-full gap-3">

              <div
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-green-300 text-green-600 shrink-0 relative"
              >
                <Hotel width={40} height={40} strokeWidth={1.75} />

                <div
                  className="flex h-[19px] w-[19px] absolute justify-center items-center rounded-full bg-green-600 text-white shrink-0 right-[8px] bottom-[8px]"
                >
                  <Check width={10} height={7} strokeWidth={1.75} />
                </div>

              </div>

              <div className="flex flex-col w-full gap-0.5">
                <div className="flex flex-row justify-between">

                  <p className="headline-5 text-green-600">
                    Check-in
                  </p>

                  <p className="headline-5 text-green-600">
                    {checkIn?.time ?? "--:--"}
                  </p>

                </div>
                <p className="body-3 text-green-500">
                  Check-in time from 2:00 PM onwards
                </p>
              </div>
            </div>


          </section>

          {/* Check-out card */}
          <section
            className="flex items-center  justify-between rounded-[16px] px-[12px] lg:px-[24px]  py-[16px] bg-orange-100"
          >
            <div className="flex items-center w-full gap-3">

              <div
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-orange-200 text-orange-500 shrink-0 relative"
              >
                <Hotel width={40} height={40} strokeWidth={1.75} />
                <div
                  className="flex h-[19px] w-[19px] absolute justify-center items-center rounded-full bg-orange-500 text-white shrink-0 right-[8px] bottom-[8px]"
                >
                  <RightDirection width={11} height={10} strokeWidth={1.75} />
                </div>
              </div>

              <div className="flex flex-col w-full gap-0.5">
                <div className="flex flex-row justify-between">

                  <p className="headline-5 text-orange-500">
                    Check-in
                  </p>

                  <p className="headline-5 text-orange-500">
                    {checkOut?.time ?? "--:--"}
                  </p>

                </div>
                <p className="body-3 text-orange-400">
                  Check-out time by 12:00 PM
                </p>
              </div>
            </div>


          </section>
        </div>
      )}
    </article>
  );
}

function CheckCardSkeleton() {
  return (
    <section
      className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-gray-50"
      aria-label="Loading average time"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
          <span className="sr-only">Loading icon</span>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </section>
  );
}

export default CheckInCheckOutTimesCard;

