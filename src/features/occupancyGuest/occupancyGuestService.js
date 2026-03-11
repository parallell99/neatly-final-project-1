import {
  parseISO,
  format,
  endOfMonth,
  eachMonthOfInterval,
  eachDayOfInterval,
} from "date-fns";
import { getRoomTypes, getOrdersOverlappingRange } from "./occupancyGuestRepository";

/**
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @param {"day" | "month"} granularity
 * @returns {Promise<{ from: string, to: string, occupancy: object, occupancyByRoomType: object, guestVisit: object, paymentMethods: Array }>}
 */
export async function getOccupancyGuest(from, to, granularity = "month") {
  const dateFrom = parseISO(from);
  const dateTo = parseISO(to);

  if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const fromStr = format(dateFrom, "yyyy-MM-dd");
  const toStr = format(dateTo, "yyyy-MM-dd");

  const [roomTypes, ordersList] = await Promise.all([
    getRoomTypes(),
    getOrdersOverlappingRange(fromStr, toStr),
  ]);

  const totalRooms = roomTypes.reduce(
    (sum, rt) => sum + (rt.total_rooms ?? 0),
    0
  );

  const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });

  const occupancyPoints =
    granularity === "day"
      ? computeOccupancyDaily(ordersList, totalRooms, dateFrom, dateTo)
      : computeOccupancyMonthly(ordersList, totalRooms, months);

  const roomTypesMeta = roomTypes.map((rt) => ({
    id: rt.id,
    label: rt.name,
    totalRooms: rt.total_rooms ?? 0,
  }));

  const occupancyByRoomTypeMonthly = computeOccupancyByRoomType(
    ordersList,
    roomTypesMeta,
    months
  );

  const ordersInRange = ordersList.filter((o) => {
    const ci = parseISO(o.check_in_date);
    return ci >= dateFrom && ci <= dateTo;
  });

  const guestVisit = computeGuestVisit(ordersInRange);
  const paymentMethods = computePaymentMethods(ordersInRange);

  return {
    from: fromStr,
    to: toStr,
    occupancy: { points: occupancyPoints },
    occupancyByRoomType: {
      roomTypes: roomTypesMeta.map(({ id, label }) => ({ id, label })),
      monthly: occupancyByRoomTypeMonthly,
    },
    guestVisit,
    paymentMethods,
  };
}

function isOrderActiveOnDay(order, day) {
  const ci = parseISO(order.check_in_date);
  const co = parseISO(order.check_out_date);
  return day >= ci && day < co;
}

function computeOccupancyDaily(ordersList, totalRooms, dateFrom, dateTo) {
  const allDays = eachDayOfInterval({ start: dateFrom, end: dateTo });
  return allDays.map((day) => {
    const occupied = ordersList.filter((o) => isOrderActiveOnDay(o, day)).length;
    return {
      date: format(day, "yyyy-MM-dd"),
      occupancyPercent:
        totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    };
  });
}

function computeOccupancyMonthly(ordersList, totalRooms, months) {
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let totalPercent = 0;

    for (const day of allDays) {
      const occupied = ordersList.filter((o) => isOrderActiveOnDay(o, day))
        .length;
      totalPercent += totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;
    }

    return {
      date: format(monthStart, "yyyy-MM-01"),
      occupancyPercent:
        allDays.length > 0 ? Math.round(totalPercent / allDays.length) : 0,
    };
  });
}

function computeOccupancyByRoomType(ordersList, roomTypesMeta, months) {
  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const occupancyPercentByRoomType = {};

    for (const rt of roomTypesMeta) {
      if (rt.totalRooms === 0) {
        occupancyPercentByRoomType[rt.id] = 0;
        continue;
      }

      const rtOrders = ordersList.filter((o) => o.room_type_id === rt.id);
      let totalPercent = 0;

      for (const day of allDays) {
        const occupied = rtOrders.filter((o) => isOrderActiveOnDay(o, day))
          .length;
        totalPercent += (occupied / rt.totalRooms) * 100;
      }

      occupancyPercentByRoomType[rt.id] =
        allDays.length > 0 ? Math.round(totalPercent / allDays.length) : 0;
    }

    return {
      month: format(monthStart, "yyyy-MM-01"),
      occupancyPercentByRoomType,
    };
  });
}

function computeGuestVisit(ordersInRange) {
  const returningCount = ordersInRange.filter(
    (o) => o.is_returning_guest === true
  ).length;
  const newCount = ordersInRange.length - returningCount;
  const totalGuests = ordersInRange.length;

  return {
    totalGuests,
    segments: [
      {
        id: "new",
        label: "New guests",
        count: newCount,
        percent:
          totalGuests > 0 ? Math.round((newCount / totalGuests) * 100) : 0,
      },
      {
        id: "returning",
        label: "Returning guests",
        count: returningCount,
        percent:
          totalGuests > 0
            ? Math.round((returningCount / totalGuests) * 100)
            : 0,
      },
    ],
  };
}

function computePaymentMethods(ordersInRange) {
  const cardCount = ordersInRange.filter(
    (o) => o.payment_method === "card"
  ).length;
  const cashCount = ordersInRange.filter(
    (o) => o.payment_method === "cash"
  ).length;
  const paidTotal = cardCount + cashCount;

  return [
    {
      id: "credit_card",
      label: "Credit card",
      count: cardCount,
      percent:
        paidTotal > 0 ? Math.round((cardCount / paidTotal) * 100) : 0,
    },
    {
      id: "cash",
      label: "Cash",
      count: cashCount,
      percent:
        paidTotal > 0 ? Math.round((cashCount / paidTotal) * 100) : 0,
    },
  ];
}
