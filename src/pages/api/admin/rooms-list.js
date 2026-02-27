import connectionPool from "@/utils/db";

/**
 * GET /api/admin/rooms-list
 * List room_properties from Postgres: room_number, room_type, bed_type, status (room_status).
 * Also returns statusOptions (all room_status) for changing status.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const roomsResult = await connectionPool.query(`
      SELECT
        rp.id,
        rp.room_number,
        rp.room_type_id,
        rp.bed_type_id,
        rp.status_id,
        rt.name         AS room_type_name,
        rbt.type_name   AS bed_type_name,
        rs.status_name  AS status_name
      FROM room_properties rp
      LEFT JOIN room_types     rt  ON rp.room_type_id = rt.id
      LEFT JOIN room_bed_type  rbt ON rp.bed_type_id  = rbt.id
      LEFT JOIN room_status    rs  ON rp.status_id    = rs.id
      ORDER BY rp.room_number ASC NULLS LAST, rp.created_at DESC
    `);

    let data = (roomsResult.rows || []).map((r) => ({
      id: r.id,
      room_number: r.room_number,
      room_type: { name: r.room_type_name || "—" },
      bed_type: { name: r.bed_type_name || "—" },
      status: {
        id: r.status_id,
        name: r.status_id != null ? (r.status_name || "—") : "—",
      },
    }));

    if (data.length === 0) {
      const typesResult = await connectionPool.query(`
        SELECT rt.id, rt.name AS room_type_name, rbt.type_name AS bed_type_name
        FROM room_types rt
        LEFT JOIN room_bed_type rbt ON rt.bed_type_id = rbt.id
        ORDER BY rt.name
      `);
      data = (typesResult.rows || []).map((r, i) => ({
        id: r.id,
        room_number: i + 1,
        room_type: { name: r.room_type_name || "—" },
        bed_type: { name: r.bed_type_name || "—" },
        status: { id: null, name: "—" },
      }));
    }

    let statusOptions = [];
    try {
      const statusResult = await connectionPool.query(`
        SELECT id, status_name FROM room_status ORDER BY id ASC
      `);
      statusOptions = (statusResult.rows || []).map((s) => ({
        id: s.id,
        name: s.status_name || "—",
      }));
    } catch (_) {}

    return res.status(200).json({ data, statusOptions });
  } catch (err) {
    console.error("[admin/rooms-list] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load rooms" });
  }
}
