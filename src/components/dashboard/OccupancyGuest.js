"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  differenceInDays,
  parseISO,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";
import { ButtonCalendar } from "@/components/ui/booking/calendar-button";
import { Calendar } from "@/components/ui/booking/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Button from "@/components/ui/buttons/buttons";
import Cash from "@/assets/icons/cash.svg"
import CreditCard from "@/assets/icons/credit.svg"

/**
 * @param {Object} props
 * @param {Date | null} props.dateFrom
 * @param {Date | null} props.dateTo
 * @param {(date: Date | null) => void} props.onDateFromChange
 * @param {(date: Date | null) => void} props.onDateToChange
 * @param {string} props.viewBy
 * @param {(value: string) => void} props.onViewByChange
 * @param {{
 *   occupancySeries: Array<{ label: string, percent: number }>,
 *   occupancyByRoomTypeSeries: Array<Object>,
 *   roomTypes: Array<{ id: string, label: string }>,
 *   guestVisit: { totalGuests: number, segments: Array<{ id: string, label: string, count: number, percent: number }> },
 *   paymentMethods: Array<{ id: string, label: string, count: number, percent: number }>
 * }} props.data
 * @param {boolean} props.loading
 * @param {"day" | "month"} [props.granularity]
 * @param {(g: "day" | "month") => void} [props.onGranularityChange]
 * @param {"day" | "month" | "quarter"} [props.resolvedGranularity]
 * @param {{ resolvedGranularity?: string, didAutoGroup?: boolean, reason?: string | null }} [props.autoGroupMeta]
 * @param {boolean} [props.useLive]
 * @param {() => void} [props.onToggleLive]
 */
function formatOccupancyChartLabel(isoDate, granularity) {
  const date = parseISO(String(isoDate));
  if (granularity === "day") return format(date, "d MMM yyyy");
  if (granularity === "month") return format(date, "MMM yyyy");
  if (granularity === "quarter") {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q} ${date.getFullYear()}`;
  }
  return isoDate;
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRooms(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n);
}

function formatRoomNights(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

/** X-axis tick: month label + date range (room types bar chart) */
function RoomTypesBarChartXAxisTick({ x, y, payload, index, chartData = [] }) {
  const date = payload?.value ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        fill="var(--gray-700)"
        fontSize={11}
      >
        <tspan x={0} dy={0}>
          {date}
        </tspan>
      </text>
    </g>
  );
}

const GRANULARITY_OPTIONS = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
];

function OccupancyGuestCard({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  viewBy,
  onViewByChange,
  granularity = "month",
  onGranularityChange,
  resolvedGranularity,
  autoGroupMeta,
  data,
  loading,
  useLive,
  onToggleLive,
}) {
  const isOverall = viewBy === "overall";

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  React.useEffect(() => {
    if (isMobile && viewBy === "room_types" && typeof onViewByChange === "function") {
      onViewByChange("overall");
    }
  }, [isMobile, viewBy, onViewByChange]);

  // resolved granularity from hook (auto-group). Fallback to local heuristic.
  const effectiveGranularity = React.useMemo(() => {
    if (resolvedGranularity) return resolvedGranularity;
    if (!dateFrom || !dateTo) return granularity;
    const days = differenceInDays(dateTo, dateFrom);
    const sameMonth = format(dateFrom, "yyyy-MM") === format(dateTo, "yyyy-MM");
    if (days <= 30 || sameMonth) return "day";
    return granularity;
  }, [dateFrom, dateTo, granularity, resolvedGranularity]);

  // จำกัดจำนวน label บนแกน X
  const isClient = typeof window !== "undefined";
  const MAX_X_TICKS = isClient && window.innerWidth < 768 ? 5 : 8;

  // chartData สำหรับ Overall occupancy (มี label, rangeText, percent)
  const occupancyChartData = React.useMemo(() => {
    const series = data.occupancySeries ?? [];
    if (effectiveGranularity === "day") {
      return series.map((item) => {
        const baseDate = parseISO(String(item.date));
        return {
          ...item,
          label: formatOccupancyChartLabel(item.date, "day"),
          rangeText: format(baseDate, "d MMM yyyy"),
        };
      });
    }
    if (effectiveGranularity === "quarter") {
      return series.map((item) => {
        const d = parseISO(String(item.date));
        let rangeStart = startOfQuarter(d);
        let rangeEnd = endOfQuarter(d);
        if (dateFrom && rangeStart < dateFrom) rangeStart = dateFrom;
        if (dateTo && rangeEnd > dateTo) rangeEnd = dateTo;
        const rangeText = `${format(rangeStart, "d MMM yyyy")} - ${format(rangeEnd, "d MMM yyyy")}`;
        return {
          ...item,
          label: formatOccupancyChartLabel(item.date, "quarter"),
          rangeText,
        };
      });
    }

    // month: API ส่ง monthly มาแล้ว - เพิ่ม label และ rangeText
    return series.map((item) => {
      const d = parseISO(String(item.date));
      let rangeStart = startOfMonth(d);
      let rangeEnd = endOfMonth(d);
      if (dateFrom && rangeStart < dateFrom) rangeStart = dateFrom;
      if (dateTo && rangeEnd > dateTo) rangeEnd = dateTo;
      const rangeText = `${format(rangeStart, "d MMM yyyy")} - ${format(rangeEnd, "d MMM yyyy")}`;
      return {
        ...item,
        label: formatOccupancyChartLabel(item.date, "month"),
        rangeText,
      };
    });
  }, [data.occupancySeries, effectiveGranularity, dateFrom, dateTo]);

  // chartData สำหรับ Room types (เพิ่ม rangeText ให้ tooltip)
  const occupancyByRoomTypeChartData = React.useMemo(() => {
    const series = data.occupancyByRoomTypeSeries ?? [];
    if (!Array.isArray(series) || series.length === 0) return [];

    return series.map((row) => {
      const baseDate = parseISO(String(row.month));
      if (Number.isNaN(baseDate.getTime())) return row;

      if (effectiveGranularity === "quarter") {
        let rangeStart = startOfQuarter(baseDate);
        let rangeEnd = endOfQuarter(baseDate);
        if (dateFrom && rangeStart < dateFrom) rangeStart = dateFrom;
        if (dateTo && rangeEnd > dateTo) rangeEnd = dateTo;
        const rangeText = `${format(rangeStart, "d MMM yyyy")} - ${format(rangeEnd, "d MMM yyyy")}`;
        const xAxisDateRange = `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`;
        return { ...row, rangeText, xAxisDateRange };
      }

      // month
      let rangeStart = startOfMonth(baseDate);
      let rangeEnd = endOfMonth(baseDate);
      if (dateFrom && rangeStart < dateFrom) rangeStart = dateFrom;
      if (dateTo && rangeEnd > dateTo) rangeEnd = dateTo;
      const rangeText = `${format(rangeStart, "d MMM yyyy")} - ${format(rangeEnd, "d MMM yyyy")}`;
      const xAxisDateRange = `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`;
      return { ...row, rangeText, xAxisDateRange };
    });
  }, [data.occupancyByRoomTypeSeries, effectiveGranularity, dateFrom, dateTo]);

  const xTicks = React.useMemo(() => {
    if (occupancyChartData.length <= MAX_X_TICKS) {
      return occupancyChartData.map((d) => d.label);
    }
    const step = Math.ceil(occupancyChartData.length / MAX_X_TICKS);
    const selected = [];
    for (let i = 0; i < occupancyChartData.length; i += step) {
      selected.push(occupancyChartData[i].label);
    }
    const lastLabel = occupancyChartData[occupancyChartData.length - 1]?.label;
    if (lastLabel && !selected.includes(lastLabel)) {
      selected.push(lastLabel);
    }
    return selected;
  }, [occupancyChartData, MAX_X_TICKS]);

  const roomTypeColors = [
    "var(--orange-500)", // orange
    "var(--green-700)", // green
    "#E5A5A5", // salmon
    "#F5DA81", // gold
    "#A8D4E0", // soft teal
    "#C4B5D4", // lavender
  ];

  const handleExport = () => {
    const range =
      dateFrom && dateTo
        ? `${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}`
        : "occupancy_guest";

    const overallSection =
      "Overall Occupancy\n" +
      "Label,Percent (%)\n" +
      occupancyChartData
        .map((item) => `${item.label},${item.percent}`)
        .join("\n");

    const roomTypeHeader =
      "Month," + data.roomTypes.map((rt) => rt.label).join(",");
    const roomTypeRows = data.occupancyByRoomTypeSeries
      .map((row) => {
        const values = data.roomTypes.map((rt) => row[rt.id] ?? 0);
        return `${row.monthLabel},${values.join(",")}`;
      })
      .join("\n");
    const roomTypeSection = "Occupancy by Room Type\n" + roomTypeHeader + "\n" + roomTypeRows;

    const guestVisitSection =
      "Guest Visit\n" +
      "Segment,Count,Percent\n" +
      data.guestVisit.segments
        .map(
          (segment) =>
            `${segment.label},${segment.count},${segment.percent}`
        )
        .join("\n");

    const paymentSection =
      "Payment Methods\n" +
      "Method,Count,Percent\n" +
      data.paymentMethods
        .map(
          (method) =>
            `${method.label},${method.count},${method.percent}`
        )
        .join("\n");

    const csv =
      overallSection +
      "\n\n" +
      roomTypeSection +
      "\n\n" +
      guestVisitSection +
      "\n\n" +
      paymentSection;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `occupancy_guest_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="flex flex-col gap-[24px]"
      aria-label="Occupancy and guest analytics"
    >

      <header>
        {/* header and export */}
        <div className="flex flex-row items-center justify-between pb-[16px]">
          <div className="flex items-center gap-[8px]">
            <h2 className="headline-5 text-gray-600">Occupancy &amp; Guest</h2>
            {typeof useLive === "boolean" && typeof onToggleLive === "function" && (
              <button
                type="button"
                onClick={onToggleLive}
                aria-label={useLive ? "Using live database data" : "Using mock data"}
                className={`hidden lg:block text-xs px-[8px] py-[4px] rounded-full border transition-colors hover:cursor-pointer ${useLive
                  ? "bg-green-50 border-green-400 text-green-700"
                  : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
              >
                {useLive ? "● Live DB" : "○ Mock"}
              </button>
            )}
          </div>
          <Button
            buttonStyle="primary"
            buttonText={"Export"}
            type="button"
            onClick={handleExport}
            className="w-[115px] h-[40px] lg:w-[167px]"
          />
        </div>

        {/* Filters – align layout with RevenueTrend */}
        <div className="grid grid-cols-2 gap-x-[16px] gap-y-[8px] pb-[24px] lg:flex lg:flex-row lg:items-center lg:pt-3 lg:pb-12 lg:flex-nowrap">
          {/* Date range: From + To */}
          <div className="col-span-2 grid grid-cols-2 gap-x-[16px] gap-y-0 lg:flex lg:flex-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2">
            <div className="flex flex-col gap-1 lg:flex-1 lg:flex-row lg:items-center lg:gap-2">
              <label
                htmlFor="occ-from"
                className="body-2 text-gray-600 lg:w-[30px] lg:shrink-0 lg:mb-0 lg:text-right lg:whitespace-nowrap"
              >
                From
              </label>
              <div className="lg:flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <ButtonCalendar
                      id="occ-from"
                      type="button"
                      className="w-full min-w-[140px] h-[40px] justify-between text-left text-[14px] font-normal shadow-none text-gray-900 rounded-[8px] border border-gray-300 bg-white hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500 data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0 hover:border-orange-500"
                    >
                      <span className={dateFrom ? "" : "text-gray-600"}>
                        {dateFrom
                          ? format(dateFrom, "d MMM yyyy")
                          : "Select start date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-gray-500" aria-hidden />
                    </ButtonCalendar>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white shadow-md border" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom ?? undefined}
                      defaultMonth={dateFrom ?? undefined}
                      onSelect={(selectedDate) =>
                        onDateFromChange(selectedDate ?? null)
                      }
                      initialFocus
                      classNames={{ day: "focus:outline-none focus:ring-0" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col gap-1 lg:flex-1 lg:flex-row lg:items-center lg:gap-2 lg:-ml-[14px]">
              <label
                htmlFor="occ-to"
                className="body-2 text-gray-600 lg:w-[30px] lg:shrink-0 lg:mb-0 lg:text-right lg:whitespace-nowrap"
              >
                to
              </label>
              <div className="lg:flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <ButtonCalendar
                      id="occ-to"
                      type="button"
                      className="w-full min-w-[140px] h-[40px] justify-between text-left text-[14px] font-normal shadow-none text-gray-900 rounded-[8px] border border-gray-300 bg-white hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500 data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0 hover:orange-500 hover:border-orange-500"
                    >
                      <span className={dateTo ? "" : "text-gray-600"}>
                        {dateTo ? format(dateTo, "d MMM yyyy") : "Select end date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-gray-500" aria-hidden />
                    </ButtonCalendar>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white shadow-md border" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo ?? undefined}
                      defaultMonth={dateTo ?? undefined}
                      onSelect={(selectedDate) =>
                        onDateToChange(selectedDate ?? null)
                      }
                      initialFocus
                      classNames={{ day: "focus:outline-none focus:ring-0" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filters: View by + Granularity */}
          <div className="col-span-2 grid grid-cols-2 gap-x-[16px] gap-y-0 lg:flex lg:flex-[2] lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2">
            <div className="flex flex-col gap-1 w-full lg:flex-1 lg:flex-row lg:items-center lg:gap-2">
              <label className="body-2 text-gray-600 lg:w-[64px] lg:shrink-0 lg:mb-0 lg:text-right lg:whitespace-nowrap">
                View by
              </label>
              <Select value={viewBy} onValueChange={onViewByChange}>
                <SelectTrigger className="w-full !h-[40px]  border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300 hover:cursor-pointer hover:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="overall" className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900 data-[highlighted]:bg-gray-100 data-[state=checked]:bg-gray-100 hover:cursor-pointer">
                    Overall
                  </SelectItem>
                  <SelectItem
                    value="room_types"
                    className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900 data-[highlighted]:bg-gray-100 data-[state=checked]:bg-gray-100 hover:cursor-pointer"
                    disabled={isMobile}
                  >
                    Room types
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 w-full lg:flex-1 lg:flex-row lg:items-center lg:gap-2">
              <label className="body-2 text-gray-600 lg:w-[84px] lg:shrink-0 lg:mb-0 lg:text-right lg:whitespace-nowrap">
                Granularity
              </label>
              <Select
                value={granularity}
                onValueChange={(v) =>
                  typeof onGranularityChange === "function" && onGranularityChange(v)
                }
                disabled={viewBy === "room_types"}
              >
                <SelectTrigger className="w-full !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300 hover:cursor-pointer hover:border-orange-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {GRANULARITY_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.id}
                      value={o.id}
                      className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900 data-[highlighted]:bg-gray-100 data-[state=checked]:bg-gray-100 hover:cursor-pointer"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {loading && !(data.occupancySeries?.length) ? (
        <OccupancyGuestSkeleton />
      ) : (
        <>
          {/* Occupancy rate chart / Room type chart */}
          <section aria-label="Occupancy rate" className="flex flex-col gap-2">
            <h3 className="font-semibold text-[16px] text-gray-700">Occupancy Rate</h3>
            <div className="w-full min-h-[240px] [&_*[tabindex]:focus]:outline-none">
              {isOverall ? (
                occupancyChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[295px] body-2 text-gray-400">
                    No data for selected range
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={295}>
                    <AreaChart
                      data={occupancyChartData}
                      margin={{ top: 8, right: 0, left: -1, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id="occGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--orange-500)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--orange-500)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--gray-300)"
                        horizontal
                        vertical={false}
                      />
                      <ReferenceLine y={80} stroke="var(--gray-300)" zIndex={0} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--gray-700)", fontSize: 12 }}
                        tickMargin={8}
                        ticks={xTicks}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "var(--gray-700)",
                          fontSize: 12,
                          textAnchor: "start",
                          dx: -45,
                        }}
                        tickFormatter={(v) => `${v}%`}
                        tickMargin={8}
                      />
                      <Tooltip
                        content={(tooltipProps) => (
                          <OccupancyTooltip
                            {...tooltipProps}
                            granularity={effectiveGranularity}
                          />
                        )}
                        cursor={{ stroke: "var(--gray-300)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="percent"
                        stroke="var(--orange-500)"
                        strokeWidth={2}
                        fill="url(#occGradient)"

                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="w-full min-h-[200px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:[display:none]">

                  <ResponsiveContainer width="100%" height={295}>
                    <BarChart
                      data={occupancyByRoomTypeChartData}
                      margin={{ top: 24, right: 8, left: -1, bottom: -16 }}
                    >
                      <CartesianGrid stroke="var(--gray-300)" horizontal vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickMargin={10}
                        height={52}
                        tick={(tickProps) => (
                          <RoomTypesBarChartXAxisTick
                            {...tickProps}
                            chartData={occupancyByRoomTypeChartData}
                          />
                        )}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--gray-700)", fontSize: 12, textAnchor: "start", dx: -45, }}
                        tickFormatter={(v) => `${v}%`}
                        tickMargin={8}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                        content={
                          <OccupancyByRoomTypeTooltip
                            roomTypes={data.roomTypes}
                            colors={roomTypeColors}
                          />
                        }
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ top: -5 }}
                        formatter={(value) => {
                          const label = data.roomTypes.find((rt) => rt.id === value)?.label ?? value;
                          return (
                            <span style={{ marginRight: 24 }}>
                              {label}
                            </span>
                          );
                        }}
                      />
                      {data.roomTypes.map((rt, index) => (
                        <Bar
                          key={rt.id}
                          dataKey={rt.id}
                          fill={roomTypeColors[index % roomTypeColors.length]}
                          radius={[4, 4, 0, 0]}
                          barSize={16}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Guest Visit */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-[48px]">
            <section aria-label="Guest visit summary" className="flex flex-col gap-[16px] lg:gap-[24px]">
              <h3 className="font-semibold text-[16px] text-gray-700">Guest Visit</h3>
              <div className="flex flex-col gap-[16px]">
                {data.guestVisit.segments.map((segment) => (
                  <div key={segment.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between body-2 ">
                      <span className="text-black ">
                        {segment.label}{" "}
                        <span className="text-gray-700">
                          {segment.count} people
                        </span>
                      </span>

                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <div className="flex-1 h-[10px] rounded-full bg-gray-300 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${segment.percent}%` }}
                          aria-hidden
                        />
                      </div>
                      <span className="body-2 font-medium text-gray-900 min-w-[40px] text-right">
                        {segment.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section aria-label="Payment method summary" className="flex flex-col gap-[16px] lg:gap-[24px]">
              <h3 className="font-semibold text-[16px] text-gray-700">Payment Method</h3>
              <div className="flex flex-col gap-[16px]">
                {data.paymentMethods.map((method) => {
                  const isCash =
                    method.id?.toLowerCase().includes("cash") ||
                    method.label?.toLowerCase().includes("cash");
                  const Icon = isCash ? Cash : CreditCard;

                  return (
                    <div key={method.id} className="flex flex-row gap-2">
                      <div className="flex bg-gray-300 w-[40px] h-[40px] rounded-full justify-center items-center shrink-0">
                        <Icon className="text-gray-700" aria-hidden />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center justify-between body-2">
                          <span className="text-black">
                            {method.label}{" "}
                            <span className="text-gray-700">
                              {method.count} people
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                          <div className="flex-1 h-[10px] rounded-full bg-gray-300 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${method.percent}%` }}
                              aria-hidden
                            />
                          </div>
                          <span className="body-2 font-medium text-gray-900 min-w-[40px] text-right">
                            {method.percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
// room type view

/** Mock data for skeleton chart shape */
const OCCUPANCY_SKELETON_DATA = [
  { label: "Jan", percent: 32 },
  { label: "Feb", percent: 45 },
  { label: "Mar", percent: 68 },
  { label: "Apr", percent: 78 },
  { label: "May", percent: 54 },
  { label: "Jun", percent: 82 },
];

function OccupancyGuestSkeleton() {
  return (
    <div
      className="flex flex-col gap-[24px]"
      aria-label="Loading occupancy and guest analytics"
    >
      <section aria-label="Occupancy rate" className="flex flex-col gap-2">
        <h3 className="font-semibold text-[16px] text-gray-700">Occupancy Rate</h3>
        <div className="w-full min-h-[240px] [&_*[tabindex]:focus]:outline-none">
          <ResponsiveContainer width="100%" height={295}>
            <AreaChart
              data={OCCUPANCY_SKELETON_DATA}
              margin={{ top: 8, right: 0, left: -1, bottom: 8 }}
            >
              <defs>
                <linearGradient
                  id="occSkeletonGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="var(--gray-300)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--gray-300)" stopOpacity={0} />
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
                tick={{ fill: "var(--gray-400)", fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--gray-400)",
                  fontSize: 12,
                  textAnchor: "start",
                  dx: -45,
                }}
                tickFormatter={(v) => `${v}%`}
                tickMargin={8}
              />
              <Area
                type="monotone"
                dataKey="percent"
                stroke="var(--gray-300)"
                strokeWidth={2}
                fill="url(#occSkeletonGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section
        aria-label="Guest visit summary"
        className="flex flex-col gap-[16px]"
      >
        <h3 className="font-semibold text-[16px] text-gray-700">Guest Visit</h3>
        <div className="flex flex-col gap-[16px]">
          {[
            { label: "New guests" },
            { label: "Returning guests" },
          ].map((segment) => (
            <div key={segment.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between body-2">
                <span className="text-black">
                  {segment.label}{" "}
                  <span className="text-gray-700">
                    <span
                      className="inline-block h-4 w-3 rounded bg-gray-200 animate-pulse"
                      aria-hidden
                    >
                      {" "}
                    </span>
                    people
                  </span>
                </span>
              </div>
              <div className="flex flex-row items-center gap-2">
                <div className="flex-1 h-[10px] rounded-full bg-gray-300 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-200 animate-pulse"
                    style={{ width: "70%" }}
                    aria-hidden
                  />
                </div>
                <span
                  className="body-2 font-medium text-gray-900 min-w-[40px] text-right"
                  aria-hidden
                >
                  <span className="inline-block h-4 w-8 rounded bg-gray-200 animate-pulse">
                    {" "}
                  </span>%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Payment method summary"
        className="flex flex-col gap-3"
      >
        <h3 className="body-2 font-medium text-gray-700">Payment Method</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Credit card", Icon: CreditCard },
            { label: "Cash", Icon: Cash },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex flex-row gap-2">
              <div className="flex bg-gray-300 w-[40px] h-[40px] rounded-full justify-center items-center shrink-0">
                <Icon className="text-gray-700" aria-hidden />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between body-2">
                  <span className="text-black">
                    {label}{" "}
                    <span className="text-gray-700">
                      <span
                        className="inline-block h-3 w-4 rounded bg-gray-200 animate-pulse align-middle"
                        aria-hidden
                      >
                        {" "}
                      </span>
                      people
                    </span>
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <div className="flex-1 h-[10px] rounded-full bg-gray-300 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-200 animate-pulse"
                      style={{ width: "65%" }}
                      aria-hidden
                    />
                  </div>
                  <span
                    className="body-2 font-medium text-gray-900 min-w-[40px] text-right"
                    aria-hidden
                  >
                    <span className="inline-block h-4 w-8 rounded bg-gray-200 animate-pulse">
                      {" "}
                    </span>%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Max room-type rows in bar chart tooltip; remainder summarized to avoid layout shift. */
const OCC_ROOM_TYPE_TOOLTIP_MAX = 8;

const OCC_TOOLTIP_BOX =
  "rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-md";
const OCC_TOOLTIP_TITLE = "font-semibold text-gray-900";
const OCC_TOOLTIP_MUTED = "text-gray-600";
const OCC_TOOLTIP_VALUE = "font-semibold text-gray-900";

/**
 * @param {Object} props
 * @param {boolean} [props.active]
 * @param {Array} [props.payload]
 * @param {"day" | "month" | "quarter"} [props.granularity]
 */
function OccupancyTooltip({ active, payload, granularity = "month" }) {
  if (!active || !payload?.length) return null;
  const {
    label,
    percent,
    rangeText,
    occupiedRooms,
    totalRooms,
    daysInPeriod,
    occupiedRoomNights,
    capacityRoomNights,
    rangeDays,
    rangeOccupiedRoomNights,
    rangeCapacityRoomNights,
  } = payload[0].payload;
  const header = rangeText ?? label;
  const isDay = granularity === "day";
  const isAggregatedPeriod = granularity === "month" || granularity === "quarter";

  if (isDay) {
    return (
      <aside
        role="tooltip"
        aria-label="Occupancy tooltip"
        className={OCC_TOOLTIP_BOX}
      >
        <p className={OCC_TOOLTIP_TITLE}>{header}</p>
        <dl className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between gap-6">
            <dt className={OCC_TOOLTIP_MUTED}>Occupancy</dt>
            <dd className={OCC_TOOLTIP_VALUE}>{formatPercent(percent)}%</dd>
          </div>
          {typeof occupiedRooms === "number" &&
            typeof totalRooms === "number" &&
            totalRooms > 0 && (
              <div className="flex justify-between gap-6">
                <dt className={OCC_TOOLTIP_MUTED}>Rooms</dt>
                <dd className={OCC_TOOLTIP_VALUE}>
                  {formatRooms(occupiedRooms)} / {totalRooms}
                </dd>
              </div>
            )}
        </dl>
      </aside>
    );
  }

  if (isAggregatedPeriod) {
    return (
      <aside
        role="tooltip"
        aria-label="Occupancy tooltip"
        className={OCC_TOOLTIP_BOX}
      >
        <p className={OCC_TOOLTIP_TITLE}>{header}</p>
        <dl className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between gap-6">
            <dt className={OCC_TOOLTIP_MUTED}>Occupancy</dt>
            <dd className={OCC_TOOLTIP_VALUE}>{formatPercent(percent)}%</dd>
          </div>
          {typeof occupiedRooms === "number" &&
            typeof totalRooms === "number" &&
            totalRooms > 0 && (
              <div className="flex justify-between gap-6">
                <dt className={OCC_TOOLTIP_MUTED}>Avg. rooms</dt>
                <dd className={OCC_TOOLTIP_VALUE}>
                  {formatRooms(occupiedRooms)} / {totalRooms}
                </dd>
              </div>
            )}
          {typeof daysInPeriod === "number" && daysInPeriod > 0 && (
            <div className="flex justify-between gap-6">
              <dt className={OCC_TOOLTIP_MUTED}>Days</dt>
              <dd className={OCC_TOOLTIP_VALUE}>{daysInPeriod}</dd>
            </div>
          )}
          {typeof capacityRoomNights === "number" && capacityRoomNights > 0 && (
            <div className="flex justify-between gap-6">
              <dt className={OCC_TOOLTIP_MUTED}>Room-nights</dt>
              <dd className={OCC_TOOLTIP_VALUE}>
                {formatRoomNights(occupiedRoomNights)}
              </dd>
            </div>
          )}
          {typeof capacityRoomNights === "number" && capacityRoomNights > 0 && (
            <div className="flex justify-between gap-6">
              <dt className={OCC_TOOLTIP_MUTED}>Capacity</dt>
              <dd className={OCC_TOOLTIP_VALUE}>
                {formatRoomNights(capacityRoomNights)}
              </dd>
            </div>
          )}
          {granularity === "month" &&
            typeof rangeDays === "number" &&
            rangeDays > 0 &&
            typeof rangeCapacityRoomNights === "number" &&
            rangeCapacityRoomNights > 0 && (
              <div className="flex justify-between gap-6 border-t border-gray-100 pt-1.5 mt-0.5">
                <dt className={OCC_TOOLTIP_MUTED}>Range ({rangeDays}d)</dt>
                <dd className={OCC_TOOLTIP_VALUE}>
                  {formatRoomNights(rangeOccupiedRoomNights)} /{" "}
                  {formatRoomNights(rangeCapacityRoomNights)}
                </dd>
              </div>
            )}
        </dl>
      </aside>
    );
  }

  return (
    <aside
      role="tooltip"
      aria-label="Occupancy tooltip"
      className={OCC_TOOLTIP_BOX}
    >
      <p className={OCC_TOOLTIP_TITLE}>{header}</p>
      <dl className="mt-2 flex flex-col gap-1">
        <div className="flex justify-between gap-6">
          <dt className={OCC_TOOLTIP_MUTED}>Occupancy</dt>
          <dd className={OCC_TOOLTIP_VALUE}>{formatPercent(percent)}%</dd>
        </div>
      </dl>
    </aside>
  );
}

function OccupancyByRoomTypeTooltip({ active, payload, roomTypes = [], colors = [] }) {
  if (!active || !payload?.length) return null;
  const { monthLabel, rangeText } = payload[0].payload;

  const sorted = [...payload].sort(
    (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0),
  );
  const visibleEntries = sorted.slice(0, OCC_ROOM_TYPE_TOOLTIP_MAX);
  const hiddenCount = sorted.length - visibleEntries.length;

  return (
    <aside
      role="tooltip"
      aria-label="Occupancy by room type tooltip"
      className={OCC_TOOLTIP_BOX}
      style={{
        maxHeight: 220,
        display: "flex",
        flexDirection: "column",
        /* Recharts Tooltip wrapper uses pointerEvents: "none"; re-enable on content so the list can scroll. */
        pointerEvents: "auto",
      }}
    >
      <p className={OCC_TOOLTIP_TITLE}>{monthLabel}</p>
      {rangeText && (
        <p className={`mt-1 ${OCC_TOOLTIP_MUTED}`}>{rangeText}</p>
      )}
      <ul
        className="mt-2 flex flex-col gap-1 overflow-y-auto"
        role="list"
        style={{ maxHeight: 140 }}
      >
        {visibleEntries.map((entry, i) => {
          const roomType = roomTypes.find((rt) => rt.id === entry.name)?.label ?? entry.name;
          const color = entry.color ?? colors[i % colors.length];
          return (
            <li key={entry.name} className="flex items-center justify-between gap-4">
              <span className={`flex min-w-0 items-center gap-2 ${OCC_TOOLTIP_MUTED}`}>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="truncate" title={roomType}>
                  {roomType}
                </span>
              </span>
              <span className={`shrink-0 tabular-nums ${OCC_TOOLTIP_VALUE}`}>
                {formatPercent(entry.value)}%
              </span>
            </li>
          );
        })}
        {hiddenCount > 0 && (
          <li className={`pt-0.5 text-xs ${OCC_TOOLTIP_MUTED}`}>
            +{hiddenCount} more room type{hiddenCount === 1 ? "" : "s"}
          </li>
        )}
      </ul>
    </aside>
  );
}

export default OccupancyGuestCard;

