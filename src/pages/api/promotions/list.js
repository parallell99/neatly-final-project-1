import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/promotions/list
 * Public API: returns only active promotions for the Special Offers page.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // promotions.end_date is a DATE column, so compare with YYYY-MM-DD (not full ISO timestamp)
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("promotions")
      .select("id, name, code, description, discount_type, discount_value, min_spend, start_date, end_date, global_usage_limit, usage_limit_per_user")
      .eq("is_active", true)
      // แสดงเฉพาะโปรโมชันที่ยังไม่หมดอายุ:
      // - end_date เป็น null (ไม่มีวันหมดอายุ)
      // - หรือ end_date >= วันนี้
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[promotions/list] error:", error);
      return res.status(500).json({ message: error.message || "Failed to load promotions" });
    }

    return res.status(200).json({ data: data ?? [] });
  } catch (err) {
    console.error("[promotions/list] unexpected error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}
