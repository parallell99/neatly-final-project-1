import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/admin/amenities
 * สร้าง amenity ใหม่ในตาราง amenities
 * body: { name: string }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name } = req.body || {};
  const trimmed = typeof name === "string" ? name.trim() : "";

  if (!trimmed) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const { data: row, error } = await supabaseAdmin
      .from("amenities")
      .insert({ name: trimmed })
      .select("id, name")
      .single();

    if (error) {
      console.error("[admin/amenities] insert error:", error);
      return res.status(500).json({ error: error.message || "Failed to create amenity" });
    }

    return res.status(201).json({ data: row });
  } catch (err) {
    console.error("[admin/amenities] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to create amenity" });
  }
}
