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
  differenceInDays,
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
 * @param {boolean} [props.useLive]
 * @param {() => void} [props.onToggleLive]
 */
function formatOccupancyChartLabel(isoDate, granularity) {
  const date = new Date(isoDate);
  if (granularity === "day") return format(date, "d MMM ");
  if (granularity === "month") return format(date, "MMM yyyy");
  return isoDate;
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

  // effectiveGranularity: ช่วง <= 30 วันหรือ同一เดือน → แสดงรายวัน
  const effectiveGranularity = React.useMemo(() => {
    if (!dateFrom || !dateTo) return granularity;
    const days = differenceInDays(dateTo, dateFrom);
    const sameMonth =
      format(dateFrom, "yyyy-MM") === format(dateTo, "yyyy-MM");
    if (days <= 30 || sameMonth) return "day";
    return granularity;
  }, [dateFrom, dateTo, granularity]);

  // จำกัดจำนวน label บนแกน X
  const isClient = typeof window !== "undefined";
  const MAX_X_TICKS = isClient && window.innerWidth < 768 ? 5 : 8;

  // chartData สำหรับ Overall occupancy (มี label, rangeText, percent)
  const occupancyChartData = React.useMemo(() => {
    const series = data.occupancySeries ?? [];
    if (effectiveGranularity === "day") {
      return series.map((item) => {
        const baseDate = new Date(item.date);
        return {
          ...item,
          label: formatOccupancyChartLabel(item.date, "day"),
          rangeText: format(baseDate, "d MMM yyyy"),
        };
      });
    }
    // month: API ส่ง monthly มาแล้ว - เพิ่ม label และ rangeText
    return series.map((item) => {
      const d = new Date(item.date);
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
                className={`hidden xl:block text-xs px-[8px] py-[4px] rounded-full border transition-colors ${
                  useLive
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

        {/* Filters */}
        <div className="grid grid-row-2 grid-cols-2 gap-x-[16px] gap-y-[8px]">
          {/* From */}
          <div className="flex flex-col gap-1">
            <label htmlFor="occ-from" className="body-2 text-gray-600">
              From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonCalendar
                  id="occ-from"
                  type="button"
                  className="w-full min-w-[140px] h-[40px] justify-between text-left text-[14px] font-normal shadow-none text-gray-900 rounded-[8px] border border-gray-300 bg-white hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500 data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0"
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

          {/* To */}
          <div className="flex flex-col gap-1">
            <label htmlFor="occ-to" className="body-2 text-gray-600">
              to
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonCalendar
                  id="occ-to"
                  type="button"
                  className="w-full min-w-[140px] h-[40px] justify-between text-left text-[14px] font-normal shadow-none text-gray-900 rounded-[8px] border border-gray-300 bg-white hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500 data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0"
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

          {/* View by */}
          <div className="flex flex-col gap-1 w-[144px]">
            <label className="body-2 text-gray-600">View by</label>
            <Select value={viewBy} onValueChange={onViewByChange}>
              <SelectTrigger className="w-full min-h-[40px] !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="overall" className="body-2">
                  Overall
                </SelectItem>
                <SelectItem
                  value="room_types"
                  className="body-2"
                  disabled={isMobile}
                >
                  Room types
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Granularity */}
          <div className="flex flex-col gap-1 w-[144px]">
            <label className="body-2 text-gray-600">Granularity</label>
            <Select
              value={granularity}
              onValueChange={(v) =>
                typeof onGranularityChange === "function" && onGranularityChange(v)
              }
            >
              <SelectTrigger className="w-full min-h-[40px] !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {GRANULARITY_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.id}
                    value={o.id}
                    className="[&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    content={<OccupancyTooltip />}
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
                    data={data.occupancyByRoomTypeSeries}
                    margin={{ top: 8, right: 8, left: -1, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--gray-300)" horizontal vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
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
                      tick={{ fill: "var(--gray-700)", fontSize: 12, textAnchor: "start", dx: -45,}}
                      tickFormatter={(v) => `${v}%`}
                      tickMargin={8}
                    />
                    <Tooltip
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
                      formatter={(value) =>
                        data.roomTypes.find((rt) => rt.id === value)?.label ?? value
                      }
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
      <section aria-label="Guest visit summary" className="flex flex-col gap-[16px]">
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
      <section aria-label="Payment method summary" className="flex flex-col gap-3">
        <h3 className="body-2 font-medium text-gray-700">Payment Method</h3>
        <div className="flex flex-col gap-2">
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

        </>
      )}
    </section>
  );
}

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

function OccupancyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, percent, rangeText, rooms, totalRooms } = payload[0].payload;
  const header = rangeText ?? label;
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg shadow-gray-200/50 backdrop-blur-sm">
      <p className="text-sm font-medium text-gray-800">{header}</p>
      <div className="mt-1.5 flex flex-col gap-0.5">
        <span className="text-sm text-gray-600">
          Occupancy: <span className="font-semibold text-gray-900">{percent}%</span>
        </span>
        {typeof rooms === "number" &&
          typeof totalRooms === "number" &&
          totalRooms > 0 && (
            <span className="text-sm text-gray-600">
              Rooms:{" "}
              <span className="font-semibold text-gray-900">
                {rooms} / {totalRooms}
              </span>
            </span>
          )}
      </div>
    </div>
  );
}

function OccupancyByRoomTypeTooltip({ active, payload, roomTypes = [], colors = [] }) {
  if (!active || !payload?.length) return null;
  const { monthLabel } = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg shadow-gray-200/50 backdrop-blur-sm">
      <p className="text-sm font-medium text-gray-800">{monthLabel}</p>
      <ul className="mt-2 flex flex-col gap-1.5" role="list">
        {payload.map((entry, i) => {
          const roomType = roomTypes.find((rt) => rt.id === entry.name)?.label ?? entry.name;
          const color = entry.color ?? colors[i % colors.length];
          return (
            <li key={entry.name} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {roomType}
              </span>
              <span className="font-semibold text-gray-900">{entry.value}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default OccupancyGuestCard;

