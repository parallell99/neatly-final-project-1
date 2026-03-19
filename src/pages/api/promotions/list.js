import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/promotions/list
 * Public API: returns only active promotions for the Special Offers page.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Prevent 304 responses (no body) and reduce cache weirdness on Vercel
    res.setHeader("Cache-Control", "no-store, max-age=0");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || (!anonKey && !serviceKey)) {
      return res.status(500).json({
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL and keys in the deployment environment.",
      });
    }

    // Prefer service role when available, fallback to anon (requires RLS policy to allow anon select)
    const supabase = createClient(supabaseUrl, serviceKey || anonKey);

    // promotions.end_date is a DATE column, so compare with YYYY-MM-DD (not full ISO timestamp)
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
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
      if (
        String(error?.message || "")
          .toLowerCase()
          .includes("permission denied")
      ) {
        return res.status(200).json({
          data: [],
          message:
            "Permission denied for table promotions (RLS). Add a SELECT policy for anon/authenticated on promotions or disable RLS. If SUPABASE_SERVICE_ROLE_KEY is set on this Vercel environment, it will be used automatically.",
        });
      }
      return res.status(500).json({ message: error.message || "Failed to load promotions" });
    }

    return res.status(200).json({ data: data ?? [] });
  } catch (err) {
    console.error("[promotions/list] unexpected error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}
