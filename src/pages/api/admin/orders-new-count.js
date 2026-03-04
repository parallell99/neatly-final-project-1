import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/orders-new-count
 * Returns count of paid orders created since a given time.
 * Query: since (optional, ISO string) — นับ order ที่ created_at >= since. ถ้าไม่ส่ง ใช้ 24 ชม. ย้อนหลัง
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const sinceParam = req.query?.since;
    let sinceIso;
    if (sinceParam && typeof sinceParam === "string") {
      const d = new Date(sinceParam);
      if (!Number.isNaN(d.getTime())) sinceIso = d.toISOString();
    }
    if (!sinceIso) {
      const since = new Date();
      since.setHours(since.getHours() - 24);
      sinceIso = since.toISOString();
    }

    const { count, error } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", sinceIso);

    if (error) {
      console.error("[admin/orders-new-count] error:", error);
      return res.status(200).json({ count: 0 });
    }

    return res.status(200).json({ count: count ?? 0 });
  } catch (err) {
    console.error("[admin/orders-new-count] ERROR:", err);
    return res.status(200).json({ count: 0 });
  }
}
