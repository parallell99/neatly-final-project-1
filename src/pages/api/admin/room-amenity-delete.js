import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/admin/room-amenity-delete
 * ลบความสัมพันธ์ระหว่าง room_type และ amenity ตามชื่อ amenity
 * body: { roomTypeId: string | number, amenityName: string }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { roomTypeId, amenityName } = req.body || {};

  if (!roomTypeId || !amenityName || typeof amenityName !== "string") {
    return res.status(400).json({ error: "roomTypeId และ amenityName จำเป็นต้องมีค่า" });
  }

  try {
    // หา amenity_id จากชื่อ (ใช้เทียบแบบ case-insensitive)
    const { data: amenityRows, error: amenityError } = await supabaseAdmin
      .from("amenities")
      .select("id, name")
      .ilike("name", amenityName.trim());

    if (amenityError) {
      console.error("[admin/room-amenity-delete] select amenities error:", amenityError);
      return res.status(500).json({ error: amenityError.message || "Failed to find amenity" });
    }

    if (!amenityRows || amenityRows.length === 0) {
      // ไม่เจอ amenity ตามชื่อที่ระบุ ถือว่าไม่มีอะไรต้องลบ
      return res.status(200).json({ data: { deleted: false } });
    }

    const amenityIds = amenityRows.map((a) => a.id);

    const { error: deleteError } = await supabaseAdmin
      .from("room_amenities")
      .delete()
      .eq("room_type_id", roomTypeId)
      .in("amenity_id", amenityIds);

    if (deleteError) {
      console.error("[admin/room-amenity-delete] delete room_amenities error:", deleteError);
      return res.status(500).json({ error: deleteError.message || "Failed to delete room amenity" });
    }

    return res.status(200).json({ data: { deleted: true } });
  } catch (err) {
    console.error("[admin/room-amenity-delete] ERROR:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to delete room amenity" });
  }
}

