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

