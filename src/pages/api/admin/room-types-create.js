import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/admin/room-types-create
 * สร้าง room_types ใหม่ (Supabase) พร้อมผูก amenities (ถ้ามี)
 * ใช้สำหรับหน้า Admin CreateRoom
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    roomType,
    roomSize,
    bedType,
    adults,
    kids,
    roomCount,
    pricePerNight,
    promotionChecked,
    promotionPrice,
    description,
    amenities = [],
    imageMainUrl,
    galleryUrls = [],
  } = req.body || {};

  if (!roomType || !pricePerNight) {
    return res
      .status(400)
      .json({ error: "roomType และ pricePerNight เป็นข้อมูลที่จำเป็น" });
  }

  try {
    // แปลงค่าตัวเลขอย่างปลอดภัย
    const toNumberOrNull = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    };

    // หา bed_type_id จากชื่อ (ถ้าระบุมา)
    let bedTypeId = null;
    if (bedType) {
      const { data: bedRows, error: bedError } = await supabaseAdmin
        .from("room_bed_type")
        .select("id, type_name")
        .ilike("type_name", bedType)
        .maybeSingle();

      if (!bedError && bedRows?.id) {
        bedTypeId = bedRows.id;
      }
    }

    // สร้าง room_type
    const { data: roomTypeRow, error: insertError } = await supabaseAdmin
      .from("room_types")
      .insert({
        name: roomType,
        room_size: toNumberOrNull(roomSize),
        bed_type_id: bedTypeId,
        room_guest_adult: toNumberOrNull(adults),
        room_guest_kid: toNumberOrNull(kids),
        total_rooms: toNumberOrNull(roomCount),
        price_per_night: toNumberOrNull(pricePerNight),
        promotion_price_per_night:
          promotionChecked && promotionPrice
            ? toNumberOrNull(String(promotionPrice).replace(/,/g, ""))
            : null,
        description: description || null,
        image_main: imageMainUrl || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[admin/room-types-create] insert room_types error:", insertError);
      return res
        .status(500)
        .json({ error: insertError.message || "Failed to create room type" });
    }

    const roomTypeId = roomTypeRow.id;

    // จัดการ amenities: หา/สร้าง แล้วผูกใน room_amenities
    const cleanedNames = (amenities || [])
      .map((name) =>
        typeof name === "string" ? name.trim() : ""
      )
      .filter(Boolean);

    if (cleanedNames.length > 0) {
      // ดึง amenities ที่มีอยู่แล้ว
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("amenities")
        .select("id, name")
        .in("name", cleanedNames);

      if (existingError) {
        console.error(
          "[admin/room-types-create] select amenities error:",
          existingError
        );
        // ไม่ต้อง fail ทั้ง endpoint แค่ไม่ผูก amenities
      } else {
        const existingMap = new Map(
          (existing || []).map((a) => [a.name.toLowerCase(), a])
        );

        const toInsertNames = cleanedNames.filter(
          (name) => !existingMap.has(name.toLowerCase())
        );

        let inserted = [];
        if (toInsertNames.length > 0) {
          const { data: insertedRows, error: insertAmenError } =
            await supabaseAdmin
              .from("amenities")
              .insert(toInsertNames.map((name) => ({ name })))
              .select("id, name");

          if (insertAmenError) {
            console.error(
              "[admin/room-types-create] insert amenities error:",
              insertAmenError
            );
          } else {
            inserted = insertedRows || [];
          }
        }

        const allAmenityRows = [
          ...(existing || []),
          ...inserted,
        ];

        const nameToId = new Map(
          allAmenityRows.map((a) => [a.name.toLowerCase(), a.id])
        );

        const linkRows = cleanedNames
          .map((name) => {
            const id = nameToId.get(name.toLowerCase());
            return id
              ? {
                  room_type_id: roomTypeId,
                  amenity_id: id,
                }
              : null;
          })
          .filter(Boolean);

        if (linkRows.length > 0) {
          const { error: linkError } = await supabaseAdmin
            .from("room_amenities")
            .insert(linkRows);

          if (linkError) {
            console.error(
              "[admin/room-types-create] insert room_amenities error:",
              linkError
            );
          }
        }
      }
    }

    // สร้าง room_properties ตามจำนวนห้อง โดยเลขห้องต่อจาก MAX(room_number) ที่มีอยู่
    const count = toNumberOrNull(roomCount) || 1;
    if (count > 0) {
      const { data: maxRow } = await supabaseAdmin
        .from("room_properties")
        .select("room_number")
        .order("room_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const startNumber = (maxRow?.room_number ?? 0) + 1;

      const roomRows = Array.from({ length: count }, (_, i) => ({
        room_type_id: roomTypeId,
        room_number: startNumber + i,
        status_id: null,
      }));

      const { error: roomPropsError } = await supabaseAdmin
        .from("room_properties")
        .insert(roomRows);

      if (roomPropsError) {
        console.error(
          "[admin/room-types-create] insert room_properties error:",
          roomPropsError
        );
      }
    }

    // จัดการ image_gallery: ผูกรูปหลายรูปกับ room_type นี้
    const gallery = (galleryUrls || [])
      .filter((url) => typeof url === "string" && url.trim() !== "");

    if (gallery.length > 0) {
      const { error: galleryError } = await supabaseAdmin
        .from("image_gallery")
        .insert(
          gallery.map((url) => ({
            room_type_id: roomTypeId,
            image_url: url,
          }))
        );

      if (galleryError) {
        console.error(
          "[admin/room-types-create] insert image_gallery error:",
          galleryError
        );
      }
    }

    return res.status(201).json({ data: { id: roomTypeId } });
  } catch (err) {
    console.error("[admin/room-types-create] ERROR:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create room type" });
  }
}

