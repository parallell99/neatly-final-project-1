import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * ดึง orders ที่สถานะ paid และมีช่วงวันที่ทับซ้อนกับ date range ที่กำหนด
 * @param {string} fromStr - YYYY-MM-DD (รวมวันนี้)
 * @param {string} toStr - YYYY-MM-DD (รวมวันนี้)
 * @returns {Promise<Array<{ check_in_date: string, check_out_date: string }>>}
 */
export async function getPaidOrdersOverlapping(fromStr, toStr) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("check_in_date, check_out_date")
    .eq("status", "paid")
    .lte("check_in_date", toStr)
    .gt("check_out_date", fromStr);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * ดึงจำนวนห้องทั้งหมดจาก room_properties
 * ใช้เป็นฐานในการคำนวณ occupancy %
 * @returns {Promise<number>}
 */
export async function getTotalRooms() {
  const { count, error } = await supabaseAdmin
    .from("room_properties")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

