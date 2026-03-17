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

function getQuarterKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return { year, quarter, key: `${year}-Q${quarter}` };
}

function quarterStartDate(year, quarter) {
  const startMonth = (quarter - 1) * 3; // 0,3,6,9
  return new Date(year, startMonth, 1);
}

function groupOccupancySeriesToQuarter(series) {
  if (!Array.isArray(series) || series.length === 0) return [];

  const buckets = new Map(); // key -> { year, quarter, sumPercent, sumOccupiedRooms, count, totalRooms }
  for (const row of series) {
    const q = getQuarterKey(row?.date);
    if (!q) continue;
    const prev = buckets.get(q.key) || {
      year: q.year,
      quarter: q.quarter,
      sumPercent: 0,
      sumOccupiedRooms: 0,
      count: 0,
      totalRooms: Number(row?.totalRooms) || 0,
    };
    const percent = Number(row?.percent) || 0;
    prev.sumPercent += percent;
    prev.sumOccupiedRooms += Number(row?.occupiedRooms) || 0;
    prev.count += 1;
    // keep max totalRooms if it changes
    const tr = Number(row?.totalRooms) || 0;
    if (tr > prev.totalRooms) prev.totalRooms = tr;
    buckets.set(q.key, prev);
  }

  return Array.from(buckets.values())
    .sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter))
    .map((b) => {
      const percent = b.count > 0 ? b.sumPercent / b.count : 0;
      const date = quarterStartDate(b.year, b.quarter).toISOString();
      const totalRooms = b.totalRooms || 0;
      const occupiedRooms = b.count > 0 ? b.sumOccupiedRooms / b.count : 0;
      return { date, percent, occupiedRooms, totalRooms };
    });
}

function groupRoomTypeSeriesToQuarter(monthlySeries, roomTypes) {
  if (!Array.isArray(monthlySeries) || monthlySeries.length === 0) return [];

  const buckets = new Map(); // key -> { year, quarter, sumByRoomType, count }
  for (const row of monthlySeries) {
    const q = getQuarterKey(row?.month);
    if (!q) continue;
    const prev = buckets.get(q.key) || {
      year: q.year,
      quarter: q.quarter,
      count: 0,
      sumByRoomType: {},
    };
    prev.count += 1;
    for (const rt of roomTypes || []) {
      const v = Number(row?.[rt.id]) || 0;
      prev.sumByRoomType[rt.id] = (prev.sumByRoomType[rt.id] || 0) + v;
    }
    buckets.set(q.key, prev);
  }

  return Array.from(buckets.values())
    .sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter))
    .map((b) => {
      const month = quarterStartDate(b.year, b.quarter).toISOString();
      const monthLabel = `Q${b.quarter} ${b.year}`;
      const base = { month, monthLabel };
      for (const rt of roomTypes || []) {
        const sum = b.sumByRoomType[rt.id] || 0;
        base[rt.id] = b.count > 0 ? sum / b.count : 0;
      }
      return base;
    });
}

export function transformOccupancyGuest(apiResponse, options = {}) {
  const totalRooms = apiResponse?.occupancy?.totalRooms ?? 0;
  let occupancySeries = (apiResponse?.occupancy?.points ?? []).map((p) => {
    const percent = p.occupancyPercent;
    const occupiedRoomsRaw = p.occupiedRooms;
    const occupiedRooms =
      typeof occupiedRoomsRaw === "number"
        ? occupiedRoomsRaw
        : (totalRooms > 0 ? ((Number(percent) || 0) * totalRooms) / 100 : 0);
    return { date: p.date, percent, occupiedRooms, totalRooms };
  });

  // room type bar (หนึ่ง record ต่อเดือน, key = roomType.id)
  const roomTypes = apiResponse?.occupancyByRoomType?.roomTypes ?? [];
  const monthly = apiResponse?.occupancyByRoomType?.monthly ?? [];

  let occupancyByRoomTypeSeries = monthly.map((m) => {
    const base = { month: m.month, monthLabel: format(new Date(m.month), "MMM yyyy") };
    const values = m.occupancyPercentByRoomType ?? {};

    roomTypes.forEach((rt) => {
      base[rt.id] = values[rt.id] ?? 0;
    });

    return base;
  });

  if (options?.resolvedGranularity === "quarter") {
    occupancySeries = groupOccupancySeriesToQuarter(occupancySeries);
    occupancyByRoomTypeSeries = groupRoomTypeSeriesToQuarter(
      occupancyByRoomTypeSeries,
      roomTypes
    );
  }

  return {
    occupancySeries,
    occupancyByRoomTypeSeries,
    roomTypes,
    guestVisit: apiResponse?.guestVisit ?? { totalGuests: 0, segments: [] },
    paymentMethods: apiResponse?.paymentMethods ?? [],
  };
}

