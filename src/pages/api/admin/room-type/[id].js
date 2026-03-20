import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/room-type/[id] - ดึง room type เดียวพร้อม gallery และ amenities
 * PATCH /api/admin/room-type/[id] - อัปเดต room type
 * DELETE /api/admin/room-type/[id] - ลบ room type
 */
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  const roomTypeId = id;

  if (req.method === "GET") {
    try {
      const { data: room, error: roomError } = await supabaseAdmin
        .from("room_types")
        .select("*")
        .eq("id", roomTypeId)
        .single();

      if (roomError || !room) {
        return res.status(404).json({ error: "Room type not found" });
      }

      const [galleryRes, amenitiesRes, bedRes] = await Promise.all([
        supabaseAdmin
          .from("image_gallery")
          .select("id, image_url")
          .eq("room_type_id", roomTypeId)
          .order("id", { ascending: true }),
        supabaseAdmin
          .from("room_amenities")
          .select("amenity_id")
          .eq("room_type_id", roomTypeId),
        room.bed_type_id
          ? supabaseAdmin
              .from("room_bed_type")
              .select("id, type_name")
              .eq("id", room.bed_type_id)
              .single()
          : { data: null },
      ]);

      const gallery = (galleryRes.data || []).map((r) => ({
        id: r.id,
        image_url: r.image_url,
      }));
      const amenityIds = [...new Set((amenitiesRes.data || []).map((r) => r.amenity_id))];
      let amenityNames = [];
      if (amenityIds.length > 0) {
        const { data: aRows } = await supabaseAdmin
          .from("amenities")
          .select("id, name")
          .in("id", amenityIds);
        amenityNames = (aRows || []).map((a) => a.name);
      }

      const bedType = bedRes.data
        ? { id: bedRes.data.id, name: bedRes.data.type_name }
        : null;

      return res.status(200).json({
        data: {
          id: room.id,
          name: room.name,
          room_size: room.room_size,
          bed_type_id: room.bed_type_id,
          bed_type: bedType,
          room_guest_adult: room.room_guest_adult,
          room_guest_kid: room.room_guest_kid,
          total_rooms: room.total_rooms,
          price_per_night: room.price_per_night,
          promotion_price: room.promotion_price_per_night ?? room.promotion_price,
          description: room.description,
          image_main: room.image_main,
          image_gallery: gallery,
          amenities: amenityNames,
        },
      });
    } catch (err) {
      console.error("[admin/room-type] GET error:", err);
      return res.status(500).json({ error: err.message || "Failed to load room type" });
    }
  }

  if (req.method === "PATCH") {
    const {
      roomType,
      roomSize,
      bedType,
      bedTypeId: bedTypeIdFromClient,
      adults,
      kids,
      totalRooms,
      pricePerNight,
      promotionChecked,
      promotionPrice,
      description,
      amenities = [],
      imageMainUrl,
      galleryUrls,
    } = req.body || {};

    try {
      const toNumberOrNull = (value) => {
        if (value === undefined || value === null || value === "") return null;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
      };

      let bedTypeId = bedTypeIdFromClient || null;
      if (!bedTypeId && bedType) {
        const { data: bedRow } = await supabaseAdmin
          .from("room_bed_type")
          .select("id, type_name")
          .ilike("type_name", bedType)
          .maybeSingle();
        if (bedRow?.id) bedTypeId = bedRow.id;
      }

      const updatePayload = {
        name: roomType ?? undefined,
        room_size: toNumberOrNull(roomSize),
        bed_type_id: bedTypeId,
        room_guest_adult: toNumberOrNull(adults),
        room_guest_kid: toNumberOrNull(kids),
        total_rooms: toNumberOrNull(totalRooms),
        price_per_night: toNumberOrNull(pricePerNight),
        promotion_price_per_night:
          promotionChecked && promotionPrice != null && promotionPrice !== ""
            ? toNumberOrNull(String(promotionPrice).replace(/,/g, ""))
            : null,
        description: description || null,
      };
      if (imageMainUrl !== undefined) updatePayload.image_main = imageMainUrl || null;

      const { error: updateError } = await supabaseAdmin
        .from("room_types")
        .update(updatePayload)
        .eq("id", roomTypeId);

      if (updateError) {
        console.error("[admin/room-type] PATCH room_types error:", updateError);
        return res.status(500).json({ error: updateError.message || "Failed to update" });
      }

      const cleanedNames = (amenities || [])
        .map((a) => (typeof a === "string" ? a.trim() : ""))
        .filter(Boolean);

      await supabaseAdmin.from("room_amenities").delete().eq("room_type_id", roomTypeId);

      if (cleanedNames.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from("amenities")
          .select("id, name")
          .in("name", cleanedNames);
        const existingMap = new Map((existing || []).map((a) => [a.name.toLowerCase(), a]));
        const toInsert = cleanedNames.filter((n) => !existingMap.has(n.toLowerCase()));
        let inserted = [];
        if (toInsert.length > 0) {
          const { data: ins } = await supabaseAdmin
            .from("amenities")
            .insert(toInsert.map((name) => ({ name })))
            .select("id, name");
          inserted = ins || [];
        }
        const all = [...(existing || []), ...inserted];
        const nameToId = new Map(all.map((a) => [a.name.toLowerCase(), a.id]));
        const linkRows = cleanedNames
          .map((name) => {
            const aid = nameToId.get(name.toLowerCase());
            return aid ? { room_type_id: roomTypeId, amenity_id: aid } : null;
          })
          .filter(Boolean);
        if (linkRows.length > 0) {
          await supabaseAdmin.from("room_amenities").insert(linkRows);
        }
      }

      const gallery = (galleryUrls || []).filter(
        (url) => typeof url === "string" && url.trim() !== ""
      );
      await supabaseAdmin.from("image_gallery").delete().eq("room_type_id", roomTypeId);
      if (gallery.length > 0) {
        await supabaseAdmin.from("image_gallery").insert(
          gallery.map((url) => ({ room_type_id: roomTypeId, image_url: url }))
        );
      }

      // ถ้าเพิ่มจำนวนห้อง → สร้าง room_properties เพิ่มโดยต่อจาก MAX(room_number)
      const newTotal = toNumberOrNull(totalRooms);
      if (newTotal != null && newTotal > 0) {
        const { data: existingRooms } = await supabaseAdmin
          .from("room_properties")
          .select("id")
          .eq("room_type_id", roomTypeId);

        const currentCount = (existingRooms || []).length;
        const diff = newTotal - currentCount;

        if (diff > 0) {
          const { data: maxRow } = await supabaseAdmin
            .from("room_properties")
            .select("room_number")
            .order("room_number", { ascending: false })
            .limit(1)
            .maybeSingle();

          const startNumber = (maxRow?.room_number ?? 0) + 1;

          const newRooms = Array.from({ length: diff }, (_, i) => ({
            room_type_id: roomTypeId,
            room_number: startNumber + i,
            status_id: null,
          }));

          const { error: roomInsertError } = await supabaseAdmin
            .from("room_properties")
            .insert(newRooms);

          if (roomInsertError) {
            console.error("[admin/room-type] PATCH insert room_properties error:", roomInsertError);
          }
        }
      }

      return res.status(200).json({ data: { id: roomTypeId } });
    } catch (err) {
      console.error("[admin/room-type] PATCH error:", err);
      return res.status(500).json({ error: err.message || "Failed to update room type" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await supabaseAdmin.from("room_amenities").delete().eq("room_type_id", roomTypeId);
      await supabaseAdmin.from("image_gallery").delete().eq("room_type_id", roomTypeId);
      await supabaseAdmin.from("room_properties").delete().eq("room_type_id", roomTypeId);
      const { error: delError } = await supabaseAdmin
        .from("room_types")
        .delete()
        .eq("id", roomTypeId);

      if (delError) {
        console.error("[admin/room-type] DELETE error:", delError);
        return res.status(500).json({ error: delError.message || "Failed to delete" });
      }
      return res.status(200).json({ data: { deleted: true } });
    } catch (err) {
      console.error("[admin/room-type] DELETE error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete room type" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
