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
import { format, startOfMonth, endOfMonth, addMonths, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";
import { ButtonCalendar } from "@/components/ui/booking/calendar-button";
import { Calendar } from "@/components/ui/booking/calendar";
import Button from "@/components/ui/buttons/buttons";

/**
 * @param {Object} props
 * @param {Date | null} props.dateFrom
 * @param {Date | null} props.dateTo
 * @param {(date: Date | null) => void} props.onDateFromChange
 * @param {(date: Date | null) => void} props.onDateToChange
 * @param {string} props.mode
 * @param {(mode: string) => void} props.onModeChange
 * @param {Array<{ label: string, revenue: number }>} props.data
 * @param {boolean} props.loading
 * @param {"day" | "month"} props.granularity
 * @param {(g: "day" | "month") => void} props.onGranularityChange
 * @param {boolean} props.useLive
 * @param {() => void} props.onToggleLive
 */

function formatChartLabel(isoDate, granularity) {
  const date = new Date(isoDate);
  if (granularity === "day") return format(date, "d MMM ");
  if (granularity === "month") return format(date, "MMM Y");
  return isoDate;
}

const REVENUE_MODES = [
  { id: "booking_date", label: "Booking Date" },
  { id: "stay_date", label: "Stay Date" },
];

const GRANULARITY_OPTIONS = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
];

function RevenueTrendCard({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  mode = "booking_date",
  onModeChange,
  data,
  loading,
  granularity = "day",
  onGranularityChange,
  useLive,
  onToggleLive,
}) {
  // จำกัดจำนวน label บนแกน X ไม่ให้แน่นเกินไป (mobile < desktop)
  const isClient = typeof window !== "undefined";
  const MAX_X_TICKS = isClient && window.innerWidth < 768 ? 5 : 8;

  // ถ้าช่วงไม่เกิน 30 วันหรืออยู่ภายในเดือนเดียวกัน → แสดงรายวันเสมอ
  const effectiveGranularity = React.useMemo(() => {
    if (!dateFrom || !dateTo) return granularity;
    const days = differenceInDays(dateTo, dateFrom);
    const sameMonth = format(dateFrom, "yyyy-MM") === format(dateTo, "yyyy-MM");
    if (days <= 30 || sameMonth) return "day";
    return granularity;
  }, [dateFrom, dateTo, granularity]);

  const formattedData = React.useMemo(() => {
    if (effectiveGranularity === "day") {
      return data.map((item) => {
        const baseDate = new Date(item.label);
        const rangeText = format(baseDate, "d MMM yyyy");
        return {
          ...item,
          label: formatChartLabel(item.label, "day"),
          rangeText,
        };
      });
    }
    // month: รวมรายวันเป็นรายเดือน แล้ว clamp ช่วงใน tooltip
    const monthMap = new Map();
    for (const item of data) {
      const d = new Date(item.label);
      const key = format(startOfMonth(d), "yyyy-MM-dd");
      const prev = monthMap.get(key);
      monthMap.set(key, (prev ?? 0) + (item.revenue ?? 0));
    }
    const months = [];
    if (dateFrom && dateTo) {
      let cursor = startOfMonth(dateFrom);
      const endMonth = addMonths(startOfMonth(dateTo), 1);
      while (cursor < endMonth) {
        const key = format(cursor, "yyyy-MM-dd");
        const revenue = monthMap.get(key) ?? 0;
        let rangeStart = cursor;
        let rangeEnd = endOfMonth(cursor);
        if (dateFrom && rangeStart < dateFrom) rangeStart = dateFrom;
        if (dateTo && rangeEnd > dateTo) rangeEnd = dateTo;
        const rangeText = `${format(rangeStart, "d MMM yyyy")} - ${format(rangeEnd, "d MMM yyyy")}`;
        months.push({
          label: key,
          revenue,
          displayLabel: formatChartLabel(key, "month"),
          rangeText,
        });
        cursor = addMonths(cursor, 1);
      }
    }
    return months;
  }, [data, effectiveGranularity, dateFrom, dateTo]);

  const chartData = effectiveGranularity === "month"
    ? formattedData.map((d) => ({ ...d, label: d.displayLabel }))
    : formattedData;

  const xTicks = React.useMemo(() => {
    if (chartData.length <= MAX_X_TICKS) {
      return chartData.map((d) => d.label);
    }
    const step = Math.ceil(chartData.length / MAX_X_TICKS);
    const selected = [];
    for (let i = 0; i < chartData.length; i += step) {
      selected.push(chartData[i].label);
    }
    const lastLabel = chartData[chartData.length - 1].label;
    if (!selected.includes(lastLabel)) {
      selected.push(lastLabel);
    }
    return selected;
  }, [chartData]);

  const handleExport = () => {
    const range = dateFrom && dateTo
      ? `${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}`
      : "revenue";
    const modeLabel = mode === "stay_date" ? "Stay Date" : "Booking Date";
    const csv =
      `Period (${granularity} by ${modeLabel}),Revenue (THB)\n` +
      chartData.map((d) => `${d.label},${d.revenue}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_trend_${mode}_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date();

  return (
    <article
      className="flex flex-col"
      aria-labelledby="revenue-trend-title"
    >
      <header className="flex flex-row items-center justify-between pb-[16px]">
        <div className="flex items-center gap-[8px]">
          <h2
            id="revenue-trend-title"
            className="headline-5 text-gray-600"
          >
            Revenue Trend
          </h2>
          {typeof useLive === "boolean" && typeof onToggleLive === "function" && (
            <button
              type="button"
              onClick={onToggleLive}
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
        <Button buttonStyle="primary" onClick={handleExport} buttonText={"Export"} type="submit" className="w-[115px] h-[40px] lg:w-[167px]" />
      </header>

      
        <div className="grid grid-row-2 grid-cols-2 gap-x-[16px] gap-y-[8px] gap- pb-[24px]">

          {/*Select date from */}
          <div className="flex flex-col gap-1">
            <label htmlFor="revenue-from" className="body-2 text-gray-600">
              From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonCalendar
                  id="revenue-from"
                  type="button"
                  className="w-full min-w-[140px] h-[40px] justify-between text-left text-[14px] font-normal shadow-none text-gray-900 rounded-[8px] border border-gray-300 bg-white hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500 data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0"
                >
                  <span className={dateFrom ? "" : "text-gray-600"}>
                    {dateFrom ? format(dateFrom, "d MMM yyyy") : "Select start date"}
                  </span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" aria-hidden />
                </ButtonCalendar>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white shadow-md border" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom ?? undefined}
                  defaultMonth={dateFrom ?? undefined}
                  onSelect={(selectedDate) => {
                    onDateFromChange(selectedDate ?? null);
                  }}
                  disabled={
                    mode === "booking_date"
                      ? (day) => day > today
                      : undefined
                  }
                  initialFocus
                  classNames={{ day: "focus:outline-none focus:ring-0" }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/*Select date to */}
          <div className="flex flex-col gap-1">
            <label htmlFor="revenue-to" className="body-2 text-gray-600">
              to
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonCalendar
                  id="revenue-to"
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
                  onSelect={(selectedDate) => {
                    onDateToChange(selectedDate ?? null);
                  }}
                  disabled={
                    mode === "booking_date"
                      ? (day) => {
                        if (!dateFrom) return false;
                        return day < dateFrom || day > today;
                      }
                      : undefined
                  }
                  initialFocus
                  classNames={{ day: "focus:outline-none focus:ring-0" }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* View by: Booking Date / Stay Date */}
          <div className="flex flex-col gap-1 w-[144px]">
            <label className="body-2 text-gray-600">View by</label>
            <Select value={mode} onValueChange={onModeChange}>
              <SelectTrigger className="w-full !h-[40px]  border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" >
                {REVENUE_MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="[&_[data-slot=select-value]]:body-2  [&_[data-slot=select-value]]:text-gray-900">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Granularity: Day / Month */}
          <div className="flex flex-col gap-1 w-[144px]">
            <label className="body-2 text-gray-600">Granularity</label>
            <Select
              value={granularity}
              onValueChange={(v) => typeof onGranularityChange === "function" && onGranularityChange(v)}
            >
              <SelectTrigger className="w-full !h-[40px] border border-gray-300 rounded-[8px] px-3 [&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900 focus-visible:ring-0 focus-visible:border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {GRANULARITY_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="[&_[data-slot=select-value]]:body-2 [&_[data-slot=select-value]]:text-gray-900">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>


      <div className="w-full min-h-[240px] [&_*[tabindex]:focus]:outline-none">
        {loading ? (
          <RevenueTrendSkeleton />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[240px] body-2 text-gray-400">
            No data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={295}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 0, left: -1, bottom: 8 }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
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
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-700)", fontSize: 12 }}
                tickMargin={8}
                ticks={xTicks}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gray-700)", fontSize: 12, textAnchor: "start", dx: -45,}}
                tickFormatter={(v) =>
                  v >= 1000 ? `${v / 1000},000` : String(v)
                }
                tickMargin={8}
              />
              <Tooltip
                content={<RevenueTrendTooltip />}
                cursor={{ stroke: "var(--gray-300)" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--orange-500)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

export default RevenueTrendCard;

const REVENUE_SKELETON_DATA = [
  { month: "Jan", revenue: 38000 },
  { month: "Feb", revenue: 16000 },
  { month: "Mar", revenue: 51000 },
  { month: "Apr", revenue: 66000 },
  { month: "May", revenue: 39000 },
  { month: "Jun", revenue: 56000 },
];

function RevenueTrendSkeleton() {
  return (
    <div
      className="w-full min-h-[240px]"
      aria-label="Loading revenue trend chart"
    >
      <ResponsiveContainer width="100%" height={295}>
        <AreaChart
          data={REVENUE_SKELETON_DATA}
          margin={{ top: 8, right: 0, left: -1, bottom: 8 }}
        >
          <CartesianGrid
            stroke="var(--gray-200)"
            horizontal
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--gray-700)", fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--gray-700)", fontSize: 12, textAnchor: "start", dx: -45,}}
            tickFormatter={(v) =>
              v >= 1000 ? `${v / 1000},000` : String(v)
            }
            tickMargin={8}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--gray-200)"
            strokeWidth={2}
            fill="var(--gray-100)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, revenue, rangeText } = payload[0].payload;
  const header = rangeText || label;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <span className="body-2 font-medium text-gray-700">{header}</span>
      <p className="body-2 text-gray-600">
        Revenue:{" "}
        <span className="font-medium text-gray-900">
          ฿{revenue.toLocaleString()}
        </span>
      </p>
    </div>
  );
}
