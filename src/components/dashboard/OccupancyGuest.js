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
import { format } from "date-fns";
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
 */
function OccupancyGuestCard({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  viewBy,
  onViewByChange,
  data,
  loading,
}) {
  const isOverall = viewBy === "overall";

  const roomTypeColors = [
    "var(--orange-500)", // orange
    "var(--green-700)", // green
    "#E5A5A5", // indigo
    "#F5DA81", // pink
  ];

  const handleExport = () => {
    const range =
      dateFrom && dateTo
        ? `${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}`
        : "occupancy_guest";

    const overallSection =
      "Overall Occupancy\n" +
      "Label,Percent (%)\n" +
      data.occupancySeries
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
          <div className="flex flex-col gap-1">
            <h2 className="headline-5 text-gray-600">Occupancy &amp; Guest</h2>
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
                <SelectItem value="room_types" className="body-2">
                  Room types
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      {/* Occupancy rate chart / Room type chart */}
      <section aria-label="Occupancy rate" className="flex flex-col gap-2">
        <h3 className="font-semibold text-[16px] text-gray-700">Occupancy Rate</h3>
        <div className="w-full min-h-[200px] [&_*[tabindex]:focus]:outline-none">
          {loading ? (
            <div
              className="w-full h-[187px] bg-gray-100 rounded-md"
              aria-label="Loading occupancy chart"
            />
          ) : isOverall ? (
            <ResponsiveContainer width="100%" height={187}>
              <AreaChart
                data={data.occupancySeries}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="occGradient" x1="0" y1="0" x2="0" y2="1">
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
                <CartesianGrid stroke="var(--gray-300)" horizontal vertical={false} />
                <ReferenceLine y={80} stroke="var(--gray-300)" zIndex={0} />
                <XAxis
                  dataKey="label"
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
                  tick={{ fill: "var(--gray-700)", fontSize: 12, textAnchor: "start", dx: -45, }}
                  tickFormatter={(v) => `${v}%`}
                  tickMargin={8}
                />
                <Tooltip
                  cursor={{ stroke: "var(--gray-300)" }}
                  formatter={(value) => [`${value}%`, "Occupancy"]}
                />
                <Area
                  type="monotone"
                  dataKey="percent"
                  stroke="var(--orange-500)"
                  strokeWidth={2}
                  fill="url(#occGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full min-h-[200px] overflow-x-auto">
              <div className="min-w-[480px] h-[187px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.occupancyByRoomTypeSeries}
                    margin={{ top: 8, right: 8, left: 45, bottom: 0 }}
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
                      tick={{ fill: "var(--gray-700)", fontSize: 12 }}
                      tickFormatter={(v) => `${v}%`}
                      tickMargin={8}
                    />
                    <Tooltip
                      formatter={(value, key) => {
                        const roomType =
                          data.roomTypes.find((rt) => rt.id === key)?.label ?? key;
                        return [`${value}%`, roomType];
                      }}
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

    </section>
  );
}

export default OccupancyGuestCard;

