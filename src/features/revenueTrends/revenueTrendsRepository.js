import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * ดึง orders ที่สถานะ paid ตาม dateField และอยู่ในช่วง [start, end) ที่กำหนด
 * @param {string} dateField - "created_at" หรือ "check_in_date"
 * @param {string} startIso - ISO string ของวันเริ่ม (รวม)
 * @param {string} endIso - ISO string ของวันสิ้นสุด (ไม่รวม)
 */
export async function getPaidOrdersForRange(dateField, startIso, endIso) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("total_price, created_at, check_in_date, check_out_date")
    .eq("status", "paid")
    .gte(dateField, startIso)
    .lt(dateField, endIso);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * ดึง orders ที่สถานะ paid และ “stay ทับซ้อน” ช่วง [startIso, endIso)
 * - order.check_in_date < endIso
 * - order.check_out_date > startIso
 */
export async function getPaidOrdersForStayDateRange(startIso, endIso) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("total_price, created_at, check_in_date, check_out_date")
    .eq("status", "paid")
    .lt("check_in_date", endIso)
    .gt("check_out_date", startIso)
    .not("check_in_date", "is", null)
    .not("check_out_date", "is", null);

  if (error) {
    throw error;
  }

  return data || [];
}

