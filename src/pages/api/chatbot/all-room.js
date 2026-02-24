import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "GET") return handleGet(req, res);
  return res.status(405).json({ error: "Method Not Allowed" });
}

async function handleGet(req, res) {
  try {
    // ดึง room_properties พร้อม join room_type, bed_type, status
    const roomsResult = await connectionPool.query(`
      SELECT
        rp.id,
        rp.room_number,
        rp.title,
        rp.description,
        rp.price_per_night,
        rp.location,
        rp.image_main,
        rp.created_at,
        rp.room_guest_adult,
        rp.room_guest_kid,

        -- room_type
        rt.id           AS room_type_id,
        rt.name         AS room_type_name,

        -- bed_type
        rbt.id          AS bed_type_id,
        rbt.type_name   AS bed_type_name,

        -- status
        rs.id           AS status_id,
        rs.status_name  AS status_name

      FROM room_properties rp
      LEFT JOIN room_types     rt  ON rp.room_type_id = rt.id
      LEFT JOIN room_bed_type  rbt ON rp.bed_type_id  = rbt.id
      LEFT JOIN room_status    rs  ON rp.status_id    = rs.id
      ORDER BY rp.created_at DESC
    `);

    // ดึง amenities และ image_gallery ของทุกห้องพร้อมกัน (ไม่ loop query)
    const roomIds = roomsResult.rows.map((r) => r.id);

    if (roomIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const [amenitiesResult, galleryResult] = await Promise.all([
      connectionPool.query(
        `SELECT
          ra.room_property_id,
          a.id   AS amenity_id,
          a.name AS amenity_name
        FROM room_amenities ra
        JOIN amenities a ON ra.amenity_id = a.id
        WHERE ra.room_property_id = ANY($1)`,
        [roomIds]
      ),
      connectionPool.query(
        `SELECT
          id,
          room_property_id,
          image_url
        FROM image_gallery
        WHERE room_property_id = ANY($1)`,
        [roomIds]
      ),
    ]);

    // Group amenities และ gallery ตาม room_property_id
    const amenitiesMap = amenitiesResult.rows.reduce((acc, row) => {
      if (!acc[row.room_property_id]) acc[row.room_property_id] = [];
      acc[row.room_property_id].push({
        id: row.amenity_id,
        name: row.amenity_name,
      });
      return acc;
    }, {});

    const galleryMap = galleryResult.rows.reduce((acc, row) => {
      if (!acc[row.room_property_id]) acc[row.room_property_id] = [];
      acc[row.room_property_id].push({
        id: row.id,
        image_url: row.image_url,
      });
      return acc;
    }, {});

    // Assemble response
    const rooms = roomsResult.rows.map((room) => ({
      id: room.id,
      room_number: room.room_number,
      title: room.title,
      description: room.description,
      price_per_night: room.price_per_night,
      location: room.location,
      image_main: room.image_main,
      created_at: room.created_at,
      room_guest_adult: room.room_guest_adult ?? null,
      room_guest_kid: room.room_guest_kid ?? null,
      room_type: {
        id: room.room_type_id,
        name: room.room_type_name,
      },
      bed_type: {
        id: room.bed_type_id,
        name: room.bed_type_name,
      },
      status: {
        id: room.status_id,
        name: room.status_name,
      },
      amenities: amenitiesMap[room.id] ?? [],
      image_gallery: galleryMap[room.id] ?? [],
    }));

    return res.status(200).json({ data: rooms });
  } catch (error) {
    console.error("GET ROOMS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}