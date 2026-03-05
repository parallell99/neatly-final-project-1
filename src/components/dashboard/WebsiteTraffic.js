"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * @param {Object} props
 * @param {string} props.pageId
 * @param {(value: string) => void} props.onPageChange
 * @param {string} props.periodId
 * @param {(value: string) => void} props.onPeriodChange
 * @param {Array<{ label: string, value: number }>} props.data
 * @param {boolean} props.loading
 */
function WebsiteTrafficCard({
  pageId,
  onPageChange,
  periodId,
  onPeriodChange,
  data,
  loading,
}) {
  const PERIODS = [
    { id: "realtime", label: "Real-time" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last_7_days", label: "Last 7 days" },
    { id: "last_30_days", label: "Last 30 days" },
  ];

  const PAGE_OPTIONS = [
    { id: "all", label: "All pages" },
    { id: "homepage", label: "Homepage" },
    { id: "rooms", label: "Rooms" },
    { id: "booking", label: "Booking" },
    { id: "blog", label: "Blog" },
  ];

  const chartData = data ?? [];

  return (
    <article
      className="flex flex-col gap-[24px]"
      aria-labelledby="website-traffic-title"
    >
      <header className="flex justify-between">
        <h2
          id="website-traffic-title"
          className="headline-5 text-gray-600"
        >
          Website traffic
        </h2>

        <div className="min-w-[140px]">
          <Select value={pageId} onValueChange={onPageChange}>
            <SelectTrigger className="!w-[136px] min-w-[136px] !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PAGE_OPTIONS.map((page) => (
                <SelectItem
                  key={page.id}
                  value={page.id}
                  className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900"
                >
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex flex-row gap-[8px] overflow-x-auto whitespace-nowrap scrollbar-hide">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            type="button"
            className={`px-[12px] py-[4px] w-fit font-normal text-[16px] rounded-[4px] border ${periodId === period.id
              ? "text-orange-500 bg-orange-100 border-orange-500"
              : " text-gray-900"
              }`}
            onClick={() => onPeriodChange(period.id)}
          >
            {period.label}

          </button>

        ))}
      </div>

      <div className="w-full min-h-[220px] [&_*[tabindex]:focus]:outline-none">
        {loading ? (
          <div className="flex items-center justify-center h-[220px] body-2 text-gray-400">
            Loading traffic data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] body-2 text-gray-400">
            No traffic data for selected filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -8, bottom: 8 }}
            >
              <defs>
                <linearGradient
                  id="trafficGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--orange-500)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--orange-500)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--gray-200)"
                horizontal
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-600)", fontSize: 11 }}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-600)", fontSize: 11 }}
                tickMargin={8}
              />
              <Tooltip content={<WebsiteTrafficTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--orange-500)"
                strokeWidth={2}
                fill="url(#trafficGradient)"
                dot={{ stroke: "var(--orange-500)", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

function WebsiteTrafficTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, value } = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="body-3 text-gray-600">{label}</p>
      <p className="body-3 text-gray-700">
        Visitors:{" "}
        <span className="font-medium text-gray-900">
          {value.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

export default WebsiteTrafficCard;

