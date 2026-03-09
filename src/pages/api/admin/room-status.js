import connectionPool from "@/utils/db";

/**
 * GET /api/admin/room-status
 * List rooms with room_number, room_type, bed_type, status (from room_properties + joins).
 *
 * POST /api/admin/room-status
 * Update a room's status by room_number.
 * Body: { room_number: string | number, status_id: number }
 */
export default async function handler(req, res) {
  if (req.method === "GET") {
    // GET /api/admin/room-status?statuses=1 — return all available statuses for dropdown
    if (req.query.statuses === "1") {
      try {
        const result = await connectionPool.query(
          `SELECT id, status_name FROM room_status ORDER BY id`
        );
        return res.status(200).json({ data: result.rows });
      } catch (err) {
        console.error("[admin/room-status] GET statuses ERROR:", err);
        return res.status(500).json({ error: err.message || "Failed to load statuses" });
      }
    }

    try {
      const result = await connectionPool.query(`
        SELECT
          rp.room_number,
          rt.name AS room_type,
          rbt.type_name AS bed_type,
          rs.status_name AS status
        FROM room_properties rp
        LEFT JOIN room_types rt ON rp.room_type_id = rt.id
        LEFT JOIN room_status rs ON rp.status_id = rs.id
        LEFT JOIN room_bed_type rbt ON rt.bed_type_id = rbt.id
        ORDER BY rp.room_number
      `);

      const data = (result.rows || []).map((row) => ({
        room_number: row.room_number,
        room_type: row.room_type ?? null,
        bed_type: row.bed_type ?? null,
        status: row.status ?? null,
      }));

      return res.status(200).json({ data });
    } catch (err) {
      console.error("[admin/room-status] GET ERROR:", err);
      return res
        .status(500)
        .json({ error: err.message || "Failed to load room status" });
    }
  }

  if (req.method === "POST") {
    const { room_number, status_id } = req.body || {};

    if (!room_number || !status_id) {
      return res
        .status(400)
        .json({ error: "room_number and status_id are required" });
    }

    try {
      const updateResult = await connectionPool.query(
        `
          UPDATE room_properties
          SET status_id = $1
          WHERE room_number = $2
          RETURNING room_number;
        `,
        [status_id, room_number]
      );

      if (updateResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Room not found for provided room_number" });
      }

      const detailResult = await connectionPool.query(
        `
          SELECT
            rp.room_number,
            rt.name AS room_type,
            rbt.type_name AS bed_type,
            rs.status_name AS status
          FROM room_properties rp
          LEFT JOIN room_types rt ON rp.room_type_id = rt.id
          LEFT JOIN room_status rs ON rp.status_id = rs.id
          LEFT JOIN room_bed_type rbt ON rt.bed_type_id = rbt.id
          WHERE rp.room_number = $1
        `,
        [room_number]
      );

      const row = detailResult.rows[0];

      return res.status(200).json({
        message: "Room status updated successfully",
        data: {
          room_number: row.room_number,
          room_type: row.room_type ?? null,
          bed_type: row.bed_type ?? null,
          status: row.status ?? null,
        },
      });
    } catch (err) {
      console.error("[admin/room-status] POST ERROR:", err);
      return res
        .status(500)
        .json({ error: err.message || "Failed to update room status" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
