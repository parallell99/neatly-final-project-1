import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/amenities-list
 * ดึงรายการ amenities ทั้งหมดจากตาราง amenities สำหรับใช้ในฟอร์มสร้างห้อง (ติ๊กเลือก)
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("amenities")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("[admin/amenities-list] error:", error);
      return res.status(500).json({ error: error.message || "Failed to load amenities" });
    }

    return res.status(200).json({ data: rows || [] });
  } catch (err) {
    console.error("[admin/amenities-list]", err);
    return res.status(500).json({ error: err.message || "Failed to load amenities" });
  }
}
