import { format } from "date-fns";
import { ROOM_AVAILABILITY_UI, DAY_LABELS } from "./mockData";

export function transformRoomAvailability(apiResponse) {
  return apiResponse.rooms.map((room) => ({
    id: room.id,
    label: ROOM_AVAILABILITY_UI[room.id]?.label ?? room.id,
    count: room.count,
    percent: Math.round((room.count / apiResponse.total) * 100),
    ...ROOM_AVAILABILITY_UI[room.id],
  }));
}

export function transformBookingTrends(apiResponse) {
  const totalRooms = apiResponse?.totalRooms ?? 0;
  return apiResponse.byDayOfWeek.map((item) => {
    const percent = item.avgOccupancyPercent;
    const rooms =
      totalRooms > 0 ? Math.round((percent / 100) * totalRooms) : 0;
    return {
      day: DAY_LABELS[item.dayOfWeek],
      percent,
      sampleCount: item.sampleCount,
      rooms,
      totalRooms,
    };
  });
}

export function transformRevenueTrend(apiResponse) {
  return {
    data: (apiResponse?.data ?? []).map((item) => ({
      label: item.label,
      revenue: item.revenue,
    })),
    // backend ส่งรายวันเสมอ ตอนนี้ granularity จะเป็น "day"
    granularity: apiResponse?.granularity ?? "day",
  };
}

export function transformOccupancyGuest(apiResponse) {
  const totalRooms = apiResponse?.occupancy?.totalRooms ?? 0;
  const occupancySeries = (apiResponse?.occupancy?.points ?? []).map((p) => {
    const percent = p.occupancyPercent;
    const rooms = totalRooms > 0 ? Math.round((percent / 100) * totalRooms) : 0;
    return { date: p.date, percent, rooms, totalRooms };
  });

  // room type bar (หนึ่ง record ต่อเดือน, key = roomType.id)
  const roomTypes = apiResponse?.occupancyByRoomType?.roomTypes ?? [];
  const monthly = apiResponse?.occupancyByRoomType?.monthly ?? [];

  const occupancyByRoomTypeSeries = monthly.map((m) => {
    const base = { month: m.month, monthLabel: format(new Date(m.month), "MMM yyyy") };
    const values = m.occupancyPercentByRoomType ?? {};

    roomTypes.forEach((rt) => {
      base[rt.id] = values[rt.id] ?? 0;
    });

    return base;
  });

  return {
    occupancySeries,
    occupancyByRoomTypeSeries,
    roomTypes,
    guestVisit: apiResponse?.guestVisit ?? { totalGuests: 0, segments: [] },
    paymentMethods: apiResponse?.paymentMethods ?? [],
  };
}

