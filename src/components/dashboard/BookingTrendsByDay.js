"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Tooltip,
} from "recharts";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BOOKING_TRENDS_PERIODS = [
  { id: "month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_2_month", label: "Last 2 months" },
];


// ── Component ──────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {string} props.periodId
 * @param {(value: string) => void} props.onPeriodChange
 * @param {Array<{ day: string, percent: number, sampleCount?: number, rooms?: number, totalRooms?: number }>} props.data
 * @param {boolean} props.loading
 * @param {boolean} props.useLive
 * @param {() => void} props.onToggleLive
 */
function BookingTrendsByDayCard({
  periodId,
  onPeriodChange,
  data,
  loading,
  useLive,
  onToggleLive,
}) {
  const chartData = data;
  const hasChartData =
    Array.isArray(chartData) &&
    chartData.some((row) => {
      const percent = Number(row?.percent) || 0;
      return percent > 0;
    });

  return (
    <article className="flex flex-col gap-[24px]" aria-labelledby="booking-trends-title">
      <header className="flex justify-between items-start lg:pb-[32px]">
        <div className="flex items-center gap-[8px]">
          <h2 id="booking-trends-title" className="headline-5 text-gray-600">
            Booking Trends by Day
          </h2>
          {typeof useLive === "boolean" && typeof onToggleLive === "function" && (
            <button
              type="button"
              onClick={onToggleLive}
              className={`hidden lg:block text-xs px-[8px] py-[4px] rounded-full border transition-colors hover:cursor-pointer ${
                useLive
                  ? "bg-green-50 border-green-400 text-green-700"
                  : "bg-gray-100 border-gray-300 text-gray-500"
              }`}
            >
              {useLive ? "● Live DB" : "○ Mock"}
            </button>
          )}
        </div>
        {/*period selection */}
        <Select value={periodId} onValueChange={onPeriodChange}>
          <SelectTrigger className="!w-[136px] min-w-[136px] !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300 hover:cursor-pointer hover:border-orange-500" aria-label="Select period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent position="popper">
            {BOOKING_TRENDS_PERIODS.map((p) => (
              <SelectItem key={p.id} value={p.id} className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900 data-[highlighted]:bg-gray-100 data-[state=checked]:bg-gray-100 hover:cursor-pointer">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> 
      </header>

      <div className="w-full min-h-[200px] [&_*[tabindex]:focus]:outline-none">
        {loading ? (
          <BookingTrendsByDaySkeleton />
        ) : !hasChartData ? (
          <div className="flex items-center justify-center h-[235px] body-2 text-gray-400">
            No data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={235}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 45, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--gray-300)" horizontal vertical={false} />
              <ReferenceLine y={80} stroke="var(--gray-300)" zIndex={0}  />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-700)", fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                mirror
                tick={{
                  fill: "var(--gray-700)",
                  fontSize: 12,
                  textAnchor: "start",
                  dx: -49,
                }}
                tickFormatter={(v) => `${v}%`}
                tickMargin={0}
              />
              <Tooltip
                content={<BookingTrendsTooltip />}
                cursor={false}
                position={{ y: 0 }}
                offset={10}
              />
              <Bar
                dataKey="percent"
                fill="var(--orange-500)"
                radius={[4, 4, 4, 4]}
                isAnimationActive={true}
                barSize={10}
                zIndex={1}
                
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

export default BookingTrendsByDayCard;

// ── Skeleton ───────────────────────────────────────────────────
const BOOKING_TRENDS_SKELETON_DATA = [
  { day: "Sun", percent: 45 },
  { day: "Mon", percent: 40 },
  { day: "Tue", percent: 55 },
  { day: "Wed", percent: 35 },
  { day: "Thu", percent: 60 },
  { day: "Fri", percent: 80 },
  { day: "Sat", percent: 90 },
];

function BookingTrendsByDaySkeleton() {
  return (
    <div className="w-full min-h-[200px]" aria-label="Loading booking trends by day chart">
      <ResponsiveContainer width="100%" height={235}>
        <BarChart
          data={BOOKING_TRENDS_SKELETON_DATA}
          margin={{ top: 8, right: 8, left: 45, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--gray-200)" horizontal vertical={false} />
          <ReferenceLine y={80} stroke="var(--gray-200)" zIndex={0} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--gray-700)", fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            axisLine={false}
            tickLine={false}
            mirror
            tick={{
              fill: "var(--gray-700)",
              fontSize: 12,
              textAnchor: "start",
              dx: -49,
            }}
            tickFormatter={(v) => `${v}%`}
            tickMargin={0}
          />
          <Bar
            dataKey="percent"
            fill="var(--gray-200)"
            radius={[4, 4, 4, 4]}
            isAnimationActive={false}
            barSize={10}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Custom Tooltip ──
function BookingTrendsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const { day, percent, sampleCount, rooms, totalRooms } = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 flex flex-col gap-1">
      <span className="body-2 font-medium text-gray-700">{day}</span>
      <span className="body-2 text-gray-600">
        Avg occupancy: <span className="font-medium text-gray-900">{percent}%</span>
      </span>
      {typeof rooms === "number" && typeof totalRooms === "number" && totalRooms > 0 && (
        <span className="body-2 text-gray-600">
          Rooms:{" "}
          <span className="font-medium text-gray-900">
            {rooms} / {totalRooms}
          </span>
        </span>
      )}
      <span className="caption text-gray-400">
        Based on {sampleCount} {sampleCount === 1 ? "occurrence" : "occurrences"}
      </span>
    </div>
  );
}