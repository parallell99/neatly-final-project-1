import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  getDay,
  parseISO,
} from "date-fns";
import { getPaidOrdersOverlapping } from "./bookingTrendsRepository";

const TOTAL_ROOMS = 50;

function getDateRangeForPeriod(period) {
  const now = new Date();
  if (period === "month") {
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }
  if (period === "last_month") {
    const last = subMonths(now, 1);
    return { from: startOfMonth(last), to: endOfMonth(last) };
  }
  if (period === "last_2_month") {
    const twoAgo = subMonths(now, 2);
    return { from: startOfMonth(twoAgo), to: endOfMonth(twoAgo) };
  }
  return null;
}

/**
 * คำนวณ booking trends โดยดึงจาก Supabase จริง
 * @param {"month" | "last_month" | "last_2_month"} period
 * @returns {Promise<{ period: string, from: string, to: string, byDayOfWeek: Array<{ dayOfWeek: number, avgOccupancyPercent: number, sampleCount: number }> }>}
 */
export async function getBookingTrends(period) {
  const range = getDateRangeForPeriod(period);
  if (!range) {
    const err = new Error("Invalid period");
    err.status = 400;
    throw err;
  }

  const { from, to } = range;
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  const orders = await getPaidOrdersOverlapping(fromStr, toStr);

  const allDays = eachDayOfInterval({ start: from, end: to });
  const dailyCount = new Map();

  for (const day of allDays) {
    dailyCount.set(day.toISOString().split("T")[0], 0);
  }

  for (const order of orders) {
    if (!order.check_in_date || !order.check_out_date) continue;

    const checkIn = parseISO(order.check_in_date);
    const checkOut = parseISO(order.check_out_date);

    for (const day of allDays) {
      if (day >= checkIn && day < checkOut) {
        const key = day.toISOString().split("T")[0];
        dailyCount.set(key, (dailyCount.get(key) || 0) + 1);
      }
    }
  }

  const dowAccumulator = Array.from({ length: 7 }, () => ({
    totalPercent: 0,
    count: 0,
  }));

  for (const day of allDays) {
    const key = day.toISOString().split("T")[0];
    const dow = getDay(day);
    const occupied = dailyCount.get(key) || 0;
    const percent = TOTAL_ROOMS > 0 ? (occupied / TOTAL_ROOMS) * 100 : 0;

    dowAccumulator[dow].totalPercent += percent;
    dowAccumulator[dow].count += 1;
  }

  const byDayOfWeek = dowAccumulator.map((acc, dow) => ({
    dayOfWeek: dow,
    avgOccupancyPercent:
      acc.count > 0 ? Math.round(acc.totalPercent / acc.count) : 0,
    sampleCount: acc.count,
  }));

  return {
    period,
    from: fromStr,
    to: toStr,
    byDayOfWeek,
  };
}

