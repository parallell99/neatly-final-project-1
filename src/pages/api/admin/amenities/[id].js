import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * PATCH /api/admin/amenities/[id] - แก้ไขชื่อ amenity (กระทบทุกห้อง)
 * DELETE /api/admin/amenities/[id] - ลบ amenity จากระบบ (ลบ room_amenities ที่อ้างถึงก่อน)
 */
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  if (req.method === "PATCH") {
    const { name } = req.body || {};
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      return res.status(400).json({ error: "name is required" });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("amenities")
        .update({ name: trimmed })
        .eq("id", id)
        .select("id, name")
        .maybeSingle();

      if (error) {
        console.error("[admin/amenities/[id]] patch error:", error);
        return res.status(500).json({ error: error.message || "Failed to update amenity" });
      }

      return res.status(200).json({ data });
    } catch (err) {
      console.error("[admin/amenities/[id]] PATCH ERROR:", err);
      return res.status(500).json({ error: err.message || "Failed to update amenity" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await supabaseAdmin.from("room_amenities").delete().eq("amenity_id", id);

      const { error: delError } = await supabaseAdmin.from("amenities").delete().eq("id", id);

      if (delError) {
        console.error("[admin/amenities/[id]] delete error:", delError);
        return res.status(500).json({ error: delError.message || "Failed to delete amenity" });
      }

      return res.status(200).json({ data: { deleted: true } });
    } catch (err) {
      console.error("[admin/amenities/[id]] DELETE ERROR:", err);
      return res.status(500).json({ error: err.message || "Failed to delete amenity" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
