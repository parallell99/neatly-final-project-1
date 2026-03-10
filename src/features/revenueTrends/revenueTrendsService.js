import {
  startOfDay,
  addDays,
  eachDayOfInterval,
  startOfMonth,
  addMonths,
  format,
} from "date-fns";
import { getPaidOrdersForRange } from "./revenueTrendsRepository";
import { AppError } from "@/utils/AppError";

const VALID_MODES = ["booking_date", "stay_date"];

function getGranularity() {
  // backend ส่งรายวันเสมอ ให้ frontend เป็นคนเลือกว่าจะดู day/month เอง
  return "day";
}

function validateParams(from, to, mode) {
  if (!from || !to) {
    throw new AppError("Missing required params: from, to", 400);
  }
  if (!VALID_MODES.includes(mode)) {
    throw new AppError("Invalid mode", 400);
  }
}

/**
 * คืนทุก bucket ตาม granularity ระหว่าง dateFrom–dateTo พร้อม revenue 0 สำหรับช่วงที่ไม่มี order
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @param {"booking_date" | "stay_date"} mode
 */
export async function getRevenueTrend(from, to, mode = "booking_date") {
  validateParams(from, to, mode);

  const dateFrom = startOfDay(new Date(from));
  const dateTo = startOfDay(new Date(to));

  const granularity = getGranularity();
  const dateField = mode === "stay_date" ? "check_in_date" : "created_at";

  const start = startOfDay(dateFrom).toISOString();
  const end = addDays(startOfDay(dateTo), 1).toISOString();

  const orders = await getPaidOrdersForRange(dateField, start, end);

  // 1) รวม revenue ตาม bucket key
  const groupMap = new Map();

  for (const order of orders || []) {
    if (mode === "stay_date") {
      // กระจายรายได้ตามแต่ละคืนที่เข้าพักภายในช่วงที่เลือก
      if (!order.check_in_date) continue;

      const stayStart = startOfDay(new Date(order.check_in_date));
      const stayEndBase = order.check_out_date
        ? startOfDay(new Date(order.check_out_date))
        : addDays(stayStart, 1);

      // จำกัดเฉพาะช่วงที่ทับซ้อนกับ [dateFrom, dateTo+1)
      const rangeEnd = addDays(dateTo, 1);
      const segmentStart = stayStart > dateFrom ? stayStart : dateFrom;
      const segmentEnd = stayEndBase < rangeEnd ? stayEndBase : rangeEnd;

      if (segmentEnd <= segmentStart) continue;

      const nights = differenceInDays(segmentEnd, segmentStart);
      const perNight =
        nights > 0 ? Number(order.total_price || 0) / nights : Number(order.total_price || 0);

      let d = segmentStart;
      while (d < segmentEnd) {
        const key = format(d, "yyyy-MM-dd");

        const prev = groupMap.get(key);
        const total = (prev?.total ?? 0) + perNight;
        const maxDate =
          prev && prev.maxDate ? (d > prev.maxDate ? d : prev.maxDate) : d;

        groupMap.set(key, { total, maxDate });

        d = addDays(d, 1);
      }
    } else {
      // booking_date: ใช้วันที่ของ created_at ตรงๆ
      const raw = order[dateField];
      if (!raw) continue;

      const d = new Date(raw);
      const key = format(d, "yyyy-MM-dd");

      const prev = groupMap.get(key);
      const total = (prev?.total ?? 0) + Number(order.total_price || 0);
      const maxDate =
        prev && prev.maxDate ? (d > prev.maxDate ? d : prev.maxDate) : d;

      groupMap.set(key, { total, maxDate });
    }
  }

  // 2) สร้าง bucket ครบทุกช่วง (รวม 0 ด้วย) ตาม granularity
  const buckets = [];

  // backend ส่งรายวันเสมอ (เติม 0 ให้ทุกวันในช่วง)
  const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
  for (const day of days) {
    const key = format(day, "yyyy-MM-dd");
    const bucket = groupMap.get(key);
    buckets.push({
      key,
      labelDate: key,
      total: bucket?.total ?? 0,
    });
  }

  const data = buckets
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ labelDate, total }) => ({
      label: labelDate,
      revenue: total,
    }));

  return {
    from,
    to,
    mode,
    granularity,
    data,
  };
}

