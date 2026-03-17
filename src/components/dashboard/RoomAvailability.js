"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Skeleton from "@/components/ui/Skeleton";

const ROOM_AVAILABILITY_UI = {
  occupied: { color: "bg-orange-500", strokeColor: "var(--orange-500)", label: "Occupied" },
  booked: { color: "bg-green-700", strokeColor: "var(--green-700)", label: "Booked" },
  available: { color: "bg-gray-500", strokeColor: "var(--gray-500)", label: "Available" },
};

const ROOM_AVAILABILITY_PERIODS = [
  { id: "month", label: "This month" },
  { id: "week", label: "This week" },
  { id: "day", label: "Today" },
];

/**
 * @param {Object} props
 * @param {string} props.periodId
 * @param {(value: string) => void} props.onPeriodChange
 * @param {Array<{ id: string, label: string, count: number, percent: number, color: string, strokeColor: string }>} props.data
 * @param {boolean} props.loading
 */

function RoomAvailabilityCard({ periodId, onPeriodChange, data, loading }) {
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.count,
  }));

  const chartColors = data.map((item) => item.strokeColor);

  return (
    <article
      className="flex flex-col gap-[24px] lg:h-full"
      aria-labelledby="room-availability-title"
    >
      <header className="flex justify-between items-center">
        <h5
          id="room-availability-title"
          className="headline-5 text-gray-600"
        >
          Room Availability
        </h5>

        <Select value={periodId} onValueChange={onPeriodChange}>
          <SelectTrigger className="!w-[136px] min-w-[136px] !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300 hover:cursor-pointer hover:border-orange-500 " aria-label="Select period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent position="popper" >
            {ROOM_AVAILABILITY_PERIODS.map((periods) => (
              <SelectItem key={periods.id} value={periods.id} className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900  data-[highlighted]:bg-gray-100 data-[state=checked]:bg-gray-100 hover:cursor-pointer">
                {periods.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="flex flex-row items-center gap-[20px] lg:items-center lg:justify-center lg:h-full [&_*[tabindex]:focus]:outline-none">
        {loading ? (
          <RoomAvailabilitySkeleton />
        ) : (
          <>
            <div className="w-[120px] h-[120px] lg:w-[260px] lg:h-[260px] lg:flex-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="100%"
                    cx="50%"
                    cy="50%"
                    paddingAngle={0}
                    isAnimationActive={true}
                    stroke="transparent"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="flex flex-col gap-3 w-[160px] shrink-0 lg:self-end">
              {data.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-sm ${item.color}`}
                    aria-hidden
                  />
                  <span className="body-2 text-gray-700">
                    {item.label}:{" "}
                    <span className="font-medium">
                      {item.count} Rooms
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}

export default RoomAvailabilityCard;

const ROOM_AVAILABILITY_SKELETON_IDS = Object.keys(ROOM_AVAILABILITY_UI);

function RoomAvailabilitySkeleton() {
  return (
    <>
      <div
        className="w-[120px] h-[120px] lg:w-[260px] lg:h-[260px] lg:flex-none"
        aria-label="Loading chart"
      >

      </div>

      <ul
        className="flex flex-col gap-3 w-[160px] shrink-0 lg:self-end"
        aria-busy="true"
        aria-label="Loading legend"
      >
        {ROOM_AVAILABILITY_SKELETON_IDS.map((id) => {
          const item = ROOM_AVAILABILITY_UI[id];
          return (
            <li key={id} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-sm shrink-0 ${item.color}`}
                aria-hidden
              />
              <span className="body-2 text-gray-700">
                {item.label}:{" "}
                <span className="font-medium">
                  <Skeleton className="h-4 w-4 inline-block align-middle" />
                  {" "}Rooms
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
