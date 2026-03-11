import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * ดึง room_types ทั้งหมด
 * @returns {Promise<Array<{ id: string, name: string, total_rooms: number }>>}
 */
export async function getRoomTypes() {
  const { data, error } = await supabaseAdmin
    .from("room_types")
    .select("id, name, total_rooms")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * ดึง orders ที่ overlap กับช่วงวันที่และ status = paid
 * @param {string} fromStr - YYYY-MM-DD
 * @param {string} toStr - YYYY-MM-DD
 * @returns {Promise<Array<{ id: string, room_type_id: string, check_in_date: string, check_out_date: string, is_returning_guest: boolean, payment_method: string }>>}
 */
export async function getOrdersOverlappingRange(fromStr, toStr) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, room_type_id, check_in_date, check_out_date, is_returning_guest, payment_method"
    )
    .eq("status", "paid")
    .lt("check_in_date", toStr)
    .gt("check_out_date", fromStr);

  if (error) throw error;
  return data ?? [];
}
