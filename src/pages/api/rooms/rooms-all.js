import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/rooms/rooms-all
 * ดึงจาก room_types (มี image_main) และรวม image_gallery ตาม room_type_id
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("room_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[rooms/rooms-all] room_types error:", error);
      return res.status(500).json({ error: error.message || "Failed to load rooms" });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const roomTypeIds = rows.map((r) => r.id);
    let galleryByRoomType = {};

    try {
      const { data: galleryRows } = await supabaseAdmin
        .from("image_gallery")
        .select("id, room_type_id, image_url")
        .in("room_type_id", roomTypeIds);

      galleryByRoomType = (galleryRows || []).reduce((acc, row) => {
        if (!acc[row.room_type_id]) acc[row.room_type_id] = [];
        acc[row.room_type_id].push({
          id: row.id,
          image_url: row.image_url,
        });
        return acc;
      }, {});
    } catch (_) {
      // image_gallery อาจไม่มี
    }

    const bedTypeIds = [...new Set(rows.map((r) => r.bed_type_id).filter(Boolean))];
    let bedTypeMap = {};
    if (bedTypeIds.length > 0) {
      try {
        const { data: bedRows } = await supabaseAdmin
          .from("room_bed_type")
          .select("id, type_name")
          .in("id", bedTypeIds);
        bedTypeMap = (bedRows || []).reduce((acc, b) => {
          acc[b.id] = { id: b.id, name: b.type_name };
          return acc;
        }, {});
      } catch (_) {}
    }

    let amenitiesByRoomType = {};
    try {
      const { data: raRows } = await supabaseAdmin
        .from("room_amenities")
        .select("room_type_id, amenity_id")
        .in("room_type_id", roomTypeIds);
      const amenityIds = [...new Set((raRows || []).map((r) => r.amenity_id).filter(Boolean))];
      let amenityNames = {};
      if (amenityIds.length > 0) {
        const { data: aRows } = await supabaseAdmin
          .from("amenities")
          .select("id, name")
          .in("id", amenityIds);
        amenityNames = (aRows || []).reduce((acc, a) => {
          acc[a.id] = a.name;
          return acc;
        }, {});
      }
      amenitiesByRoomType = (raRows || []).reduce((acc, row) => {
        if (!acc[row.room_type_id]) acc[row.room_type_id] = [];
        const name = amenityNames[row.amenity_id];
        if (name) acc[row.room_type_id].push({ id: row.amenity_id, name });
        return acc;
      }, {});
    } catch (_) {}

    const rooms = rows.map((room) => {
      const gallery = galleryByRoomType[room.id] ?? [];
      const mainUrl = room.image_main ?? gallery[0]?.image_url ?? null;
      return {
        id: room.id,
        name: room.name,
        title: room.name,
        image_main: mainUrl,
        image_gallery: gallery,
        room_type: { id: room.id, name: room.name },
        price_per_night: room.price_per_night,
        promotion_price: room.promotion_price_per_night ?? room.promotion_price,
        description: room.description,
        location: room.location,
        room_guest_adult: room.room_guest_adult,
        room_guest_kid: room.room_guest_kid,
        bed_type_id: room.bed_type_id,
        bed_type: room.bed_type_id ? bedTypeMap[room.bed_type_id] ?? null : null,
        room_size: room.room_size,
        total_rooms: room.total_rooms ?? room.totalRooms ?? null,
        amenities: amenitiesByRoomType[room.id] ?? [],
        created_at: room.created_at,
        updated_at: room.updated_at,
      };
    });

    return res.status(200).json({ data: rooms });
  } catch (err) {
    console.error("[rooms/rooms-all] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load rooms" });
  }
}
