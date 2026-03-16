import { format, parseISO, startOfDay, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { MOCK_ORDERS, ROOM_TYPES } from "@/utils/DashboardMockData/order";

// ── Room Availability mock , transform -------------------------------------------------------
export const ROOM_AVAILABILITY_UI = {
  occupied: { color: "bg-orange-500", strokeColor: "var(--orange-500)", label: "Occupied" },
  booked: { color: "bg-green-700", strokeColor: "var(--green-700)", label: "Booked" },
  available: { color: "bg-gray-500", strokeColor: "var(--gray-500)", label: "Available" },
};

export const ROOM_AVAILABILITY_MOCK = {
  month: {
    period: "month",
    total: 50,
    rooms: [
      { id: "occupied", count: 21 },
      { id: "booked", count: 14 },
      { id: "available", count: 15 },
    ],
  },
  week: {
    period: "week",
    total: 50,
    rooms: [
      { id: "occupied", count: 18 },
      { id: "booked", count: 20 },
      { id: "available", count: 12 },
    ],
  },
  day: {
    period: "day",
    total: 50,
    rooms: [
      { id: "occupied", count: 10 },
      { id: "booked", count: 5 },
      { id: "available", count: 35 },
    ],
  },
};

// ── Booking Trends mock  ---------------------------------------------------------------------
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const BOOKING_TRENDS_MOCK = {
  month: {
    period: "month",
    byDayOfWeek: [
      { dayOfWeek: 0, avgOccupancyPercent: 72, sampleCount: 3 },
      { dayOfWeek: 1, avgOccupancyPercent: 68, sampleCount: 2 },
      { dayOfWeek: 2, avgOccupancyPercent: 88, sampleCount: 2 },
      { dayOfWeek: 3, avgOccupancyPercent: 62, sampleCount: 2 },
      { dayOfWeek: 4, avgOccupancyPercent: 50, sampleCount: 2 },
      { dayOfWeek: 5, avgOccupancyPercent: 88, sampleCount: 2 },
      { dayOfWeek: 6, avgOccupancyPercent: 94, sampleCount: 2 },
    ],
  },
  last_month: {
    period: "last_month",
    byDayOfWeek: [
      { dayOfWeek: 0, avgOccupancyPercent: 62, sampleCount: 4 },
      { dayOfWeek: 1, avgOccupancyPercent: 53, sampleCount: 4 },
      { dayOfWeek: 2, avgOccupancyPercent: 79, sampleCount: 4 },
      { dayOfWeek: 3, avgOccupancyPercent: 82, sampleCount: 4 },
      { dayOfWeek: 4, avgOccupancyPercent: 65, sampleCount: 4 },
      { dayOfWeek: 5, avgOccupancyPercent: 91, sampleCount: 4 },
      { dayOfWeek: 6, avgOccupancyPercent: 97, sampleCount: 4 },
    ],
  },
  last_2_month: {
    period: "last_2_month",
    byDayOfWeek: [
      { dayOfWeek: 0, avgOccupancyPercent: 53, sampleCount: 4 },
      { dayOfWeek: 1, avgOccupancyPercent: 50, sampleCount: 5 },
      { dayOfWeek: 2, avgOccupancyPercent: 71, sampleCount: 4 },
      { dayOfWeek: 3, avgOccupancyPercent: 79, sampleCount: 5 },
      { dayOfWeek: 4, avgOccupancyPercent: 59, sampleCount: 4 },
      { dayOfWeek: 5, avgOccupancyPercent: 85, sampleCount: 5 },
      { dayOfWeek: 6, avgOccupancyPercent: 94, sampleCount: 4 },
    ],
  },
};

// ── Check-in / Check-out averages mock ------------------------------------------------------
export const CHECKIN_CHECKOUT_MOCK = {
  checkIn: {
    label: "Check-in",
    time: "4:03 PM",
    description: "Check-in time from 2:00 PM onwards",
  },
  checkOut: {
    label: "Check-out",
    time: "10:32 PM",
    description: "Check-out time by 12:00 PM",
  },
};

// ── Occupancy & Guest (computed from MOCK_ORDERS) -------------------------------------------
// จำนวนห้องรวมจาก DB จริง (room_types.total_rooms)
const TOTAL_ROOMS = ROOM_TYPES.reduce((sum, rt) => sum + (rt.total_rooms ?? 0), 0);

function isOrderActiveOnDay(parsedOrder, day) {
  return day >= parsedOrder.ci && day < parsedOrder.co;
}

export function computeOccupancyFromMockOrders(dateFrom, dateTo, granularity) {
  const fromStr = format(dateFrom, "yyyy-MM-dd");
  const toStr = format(dateTo, "yyyy-MM-dd");

  const ordersList = MOCK_ORDERS.filter((o) => {
    if (!o.check_in_date || !o.check_out_date) return false;
    return o.check_in_date < toStr && o.check_out_date > fromStr;
  });

  // Pre-parse ครั้งเดียว (ลดการ parseISO ซ้ำใน loop)
  const parsed = ordersList.map((o) => ({
    ci: parseISO(o.check_in_date),
    co: parseISO(o.check_out_date),
    room_type_id: o.room_type_id,
    is_returning_guest: o.is_returning_guest,
    payment_method: o.payment_method,
  }));

  const roomTypesMeta = ROOM_TYPES.map((rt) => ({
    id: rt.id,
    label: rt.name ?? rt.id,
    totalRooms: rt.total_rooms ?? 0,
  }));

  const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });

  const occupancyPoints =
    granularity === "day"
      ? (() => {
          const allDays = eachDayOfInterval({ start: dateFrom, end: dateTo });
          return allDays.map((day) => {
            const raw = parsed.filter((o) => isOrderActiveOnDay(o, day)).length;
            const occupied = Math.min(raw, TOTAL_ROOMS);
            return {
              date: format(day, "yyyy-MM-dd"),
              occupancyPercent:
                TOTAL_ROOMS > 0 ? Math.min(100, Math.round((occupied / TOTAL_ROOMS) * 100)) : 0,
            };
          });
        })()
      : months.map((monthStart) => {
          const monthEnd = endOfMonth(monthStart);
          const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
          let totalPercent = 0;
          for (const day of allDays) {
            const raw = parsed.filter((o) => isOrderActiveOnDay(o, day)).length;
            const occupied = Math.min(raw, TOTAL_ROOMS);
            totalPercent += TOTAL_ROOMS > 0 ? (occupied / TOTAL_ROOMS) * 100 : 0;
          }
          return {
            date: format(monthStart, "yyyy-MM-01"),
            occupancyPercent:
              allDays.length > 0 ? Math.min(100, Math.round(totalPercent / allDays.length)) : 0,
          };
        });

  const occupancyByRoomTypeMonthly = months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const occupancyPercentByRoomType = {};
    for (const rt of roomTypesMeta) {
      const rtParsed = parsed.filter((o) => o.room_type_id === rt.id);
      let totalPercent = 0;
      for (const day of allDays) {
        const raw = rtParsed.filter((o) => isOrderActiveOnDay(o, day)).length;
        const occupied = Math.min(raw, rt.totalRooms);
        totalPercent += rt.totalRooms > 0 ? (occupied / rt.totalRooms) * 100 : 0;
      }
      occupancyPercentByRoomType[rt.id] =
        allDays.length > 0 ? Math.min(100, Math.round(totalPercent / allDays.length)) : 0;
    }
    return { month: format(monthStart, "yyyy-MM-01"), occupancyPercentByRoomType };
  });

  const dateFromT = startOfDay(dateFrom).getTime();
  const dateToT = startOfDay(dateTo).getTime();
  const ordersInRange = parsed.filter((o) => {
    const t = o.ci.getTime();
    return t >= dateFromT && t <= dateToT;
  });

  const returningCount = ordersInRange.filter((o) => o.is_returning_guest === true).length;
  const newCount = ordersInRange.length - returningCount;
  const totalGuests = ordersInRange.length;
  const guestVisit = {
    totalGuests,
    segments: [
      {
        id: "new",
        label: "New guests",
        count: newCount,
        percent: totalGuests > 0 ? Math.round((newCount / totalGuests) * 100) : 0,
      },
      {
        id: "returning",
        label: "Returning guests",
        count: returningCount,
        percent: totalGuests > 0 ? Math.round((returningCount / totalGuests) * 100) : 0,
      },
    ],
  };

  const cardCount = ordersInRange.filter((o) => o.payment_method === "card").length;
  const cashCount = ordersInRange.filter((o) => o.payment_method === "cash").length;
  const paidTotal = cardCount + cashCount;
  const paymentMethods = [
    {
      id: "credit_card",
      label: "Credit card",
      count: cardCount,
      percent: paidTotal > 0 ? Math.round((cardCount / paidTotal) * 100) : 0,
    },
    {
      id: "cash",
      label: "Cash",
      count: cashCount,
      percent: paidTotal > 0 ? Math.round((cashCount / paidTotal) * 100) : 0,
    },
  ];

  return {
    from: fromStr,
    to: toStr,
    occupancy: { points: occupancyPoints, totalRooms: TOTAL_ROOMS },
    occupancyByRoomType: {
      roomTypes: roomTypesMeta.map(({ id, label }) => ({ id, label })),
      monthly: occupancyByRoomTypeMonthly,
    },
    guestVisit,
    paymentMethods,
  };
}

