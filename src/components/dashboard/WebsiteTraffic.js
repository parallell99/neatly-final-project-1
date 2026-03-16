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

function formatTimeLabel(date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");

  return `${hours12}:${paddedMinutes} ${period}`;
}

function formatDateLabel(date) {
  const day = date.getDate();
  const monthShort = date.toLocaleString("en-US", { month: "short" });

  return `${day} ${monthShort}`;
}

function formatTrafficLabel(rawLabel, periodId) {
  if (!rawLabel) return "";

  const label = String(rawLabel);
  const parsed = new Date(label);

  if (Number.isNaN(parsed.getTime())) {
    return label;
  }

  if (periodId === "realtime" || periodId === "yesterday") {
    return formatTimeLabel(parsed);
  }

  if (periodId === "last_7_days" || periodId === "last_30_days") {
    return formatDateLabel(parsed);
  }

  return label;
}

/** Mock data for chart-shaped loading skeleton */
const TRAFFIC_SKELETON_DATA = [
  { label: "12:00 AM", labelFormatted: "12:00 AM", value: 12 },
  { label: "4:00 AM", labelFormatted: "4:00 AM", value: 8 },
  { label: "8:00 AM", labelFormatted: "8:00 AM", value: 24 },
  { label: "12:00 PM", labelFormatted: "12:00 PM", value: 32 },
  { label: "4:00 PM", labelFormatted: "4:00 PM", value: 28 },
  { label: "8:00 PM", labelFormatted: "8:00 PM", value: 18 },
  { label: "11:59 PM", labelFormatted: "11:59 PM", value: 14 },
];

/**
 * @param {Object} props
 * @param {string} props.pageId
 * @param {(value: string) => void} props.onPageChange
 * @param {string} props.periodId
 * @param {(value: string) => void} props.onPeriodChange
 * @param {Array<{ label: string, value: number }>} props.data
 * @param {boolean} props.loading
 * @param {Array<{ id: string, label: string }>} [props.roomOptions] - from room_types (id = "room:{slug}")
 */
function WebsiteTrafficCard({
  pageId,
  onPageChange,
  periodId,
  onPeriodChange,
  data,
  loading,
  roomOptions = [],
}) {
  const PERIODS = [
    { id: "realtime", label: "Real-time" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last_7_days", label: "Last 7 days" },
    { id: "last_30_days", label: "Last 30 days" },
  ];

  const STATIC_PAGE_OPTIONS_BEFORE_ROOMS = [
    { id: "all", label: "All pages" },
    { id: "homepage", label: "Homepage" },
    { id: "search_rooms", label: "Search rooms" },
    { id: "booking", label: "Booking" },
    { id: "booking_action", label: "Booking actions" },
    { id: "room_details", label: "Room details" },
  ];
  const STATIC_PAGE_OPTIONS_AFTER_ROOMS = [
    { id: "login", label: "Login" },
    { id: "register", label: "Register" },
    { id: "user_profile", label: "User profile" },
    { id: "payment_method", label: "Payment method" },
  ];
  const PAGE_OPTIONS = [
    ...STATIC_PAGE_OPTIONS_BEFORE_ROOMS,
    ...roomOptions,
    ...STATIC_PAGE_OPTIONS_AFTER_ROOMS,
  ];

  const chartData = data ?? [];
  const formattedChartData = chartData.map((item) => ({
    ...item,
    labelFormatted: formatTrafficLabel(item.label, periodId),
  }));

  // จำกัดจำนวน label บนแกน X ไม่ให้แน่นเกินไป (mobile < desktop)
  const isClient = typeof window !== "undefined";
  const MAX_X_TICKS = isClient && window.innerWidth < 768 ? 5 : 8;

  const xTicks = React.useMemo(() => {
    if (formattedChartData.length <= MAX_X_TICKS) {
      return formattedChartData.map((d) => d.labelFormatted);
    }
    const step = Math.ceil(formattedChartData.length / MAX_X_TICKS);
    const selected = [];
    for (let i = 0; i < formattedChartData.length; i += step) {
      selected.push(formattedChartData[i].labelFormatted);
    }
    const lastLabel = formattedChartData[formattedChartData.length - 1].labelFormatted;
    if (!selected.includes(lastLabel)) {
      selected.push(lastLabel);
    }
    return selected;
  }, [formattedChartData, MAX_X_TICKS]);

  return (
    <article
      className="flex flex-col gap-[24px]"
      aria-labelledby="website-traffic-title"
    >
      <header className="flex flex-row items-center justify-between gap-2">
        <h2
          id="website-traffic-title"
          className="headline-5 text-gray-600"
        >
          Website traffic
        </h2>

        <div className="flex flex-col items-stretch gap-2 xl:flex-row xl:items-center xl:gap-3">
          <div className="min-w-[140px]">
            <Select value={pageId} onValueChange={onPageChange}>
              <SelectTrigger className="w-[136px]! min-w-[136px] h-[40px]! border border-gray-300 rounded-[8px] px-3 **:data-[slot=select-value]:body-2 **:data-[slot=select-value]:text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {PAGE_OPTIONS.map((page) => (
                  <SelectItem
                    key={page.id}
                    value={page.id}
                    className="**:data-[slot=select-value]:body-2 **:data-[slot=select-value]:text-gray-900"
                  >
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period filter inline with select on xl, hidden on smaller screens */}
          <div className="hidden xl:flex flex-row gap-[8px] overflow-x-auto whitespace-nowrap scrollbar-hide">
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
        </div>
      </header>

      {/* Period filter below header on mobile/tablet */}
      <div className="flex flex-row gap-[8px] overflow-x-auto whitespace-nowrap scrollbar-hide xl:hidden">
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
          <WebsiteTrafficChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[295px] body-2 text-gray-400">
            No traffic data for selected filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={295}>
            <AreaChart
              data={formattedChartData}
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
                dataKey="labelFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-600)", fontSize: 11 }}
                tickMargin={8}
                ticks={xTicks}
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
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

export default WebsiteTrafficCard;

function WebsiteTrafficTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, labelFormatted, value } = payload[0].payload;
  const displayLabel = labelFormatted || label;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="body-3 text-gray-600">{displayLabel}</p>
      <p className="body-3 text-gray-700">
        Visitors:{" "}
        <span className="font-medium text-gray-900">
          {value.toLocaleString()}
        </span>
      </p>
    </div>
  );
}



function WebsiteTrafficChartSkeleton() {
  return (
    <div
      className="w-full animate-pulse"
      style={{ height: 295 }}
      aria-label="Loading website traffic chart"
    >
      <ResponsiveContainer width="100%" height={295}>
        <AreaChart
          data={TRAFFIC_SKELETON_DATA}
          margin={{ top: 8, right: 8, left: -8, bottom: 8 }}
        >
          <CartesianGrid
            stroke="var(--gray-200)"
            horizontal
            vertical={false}
          />
          <XAxis
            dataKey="labelFormatted"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--gray-400)", fontSize: 11 }}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--gray-400)", fontSize: 11 }}
            tickMargin={8}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--gray-300)"
            strokeWidth={2}
            fill="var(--gray-100)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

