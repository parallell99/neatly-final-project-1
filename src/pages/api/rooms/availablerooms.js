import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "GET") return handleGet(req, res);
  return res.status(405).json({ error: "Method Not Allowed" });
}

async function handleGet(req, res) {
  try {
    const { checkIn, checkOut } = req.query;

    console.log("=== GET ROOMS ===");
    console.log("checkIn:", checkIn, "| checkOut:", checkOut);

    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      return res
        .status(400)
        .json({ error: "กรุณาระบุทั้ง checkIn และ checkOut" });
    }

    const hasDateFilter = checkIn && checkOut;

    // ถ้าไม่มีวันที่ → ไม่กรองช่วงเวลา
    const bookedWhereClause = hasDateFilter
      ? `
        AND check_in_date  < $2::date
        AND check_out_date > $1::date
      `
      : "";

    const params = hasDateFilter ? [checkIn, checkOut] : [];

    const sql = `
      WITH booked_counts AS (
          SELECT
              room_type_id,
              COALESCE(SUM(quantity::int), 0) AS booked_qty
          FROM public.orders
          WHERE status != 'cancelled'
          ${bookedWhereClause}
          GROUP BY room_type_id
      ),
      unavailable_counts AS (
          SELECT
              rp.room_type_id,
              COUNT(*) AS unavailable_qty
          FROM public.room_properties rp
          JOIN public.room_status rs ON rs.id = rp.status_id
          WHERE rs.status_name IN ('Out of Order', 'Out of Service', 'Out of Inventory')
          GROUP BY rp.room_type_id
      )
      SELECT
          rt.id                             AS room_type_id,
          rt.name                           AS room_type_name,
          rt.price_per_night,
          rt.promotion_price_per_night,
          rt.description,
          rt.location,
          rt.image_main,
          rt.room_guest_adult,
          rt.room_guest_kid,
          rt.room_size,
          rbt.type_name                     AS bed_type,

          COUNT(DISTINCT rp.id)                          AS total_rooms,
          COALESCE(MAX(bc.booked_qty), 0)                AS booked_rooms,
          COALESCE(MAX(uc.unavailable_qty), 0)           AS unavailable_rooms,
          GREATEST(
              COUNT(DISTINCT rp.id)
              - COALESCE(MAX(bc.booked_qty), 0)
              - COALESCE(MAX(uc.unavailable_qty), 0),
              0
          )                                              AS available_rooms,

          JSON_AGG(
              DISTINCT JSONB_BUILD_OBJECT(
                  'room_id',     rp.id,
                  'room_number', rp.room_number,
                  'status',      rs.status_name
              )
          ) AS rooms,

          (
              SELECT JSON_AGG(ig.image_url)
              FROM image_gallery ig
              WHERE ig.room_type_id = rt.id
          ) AS gallery,

          (
              SELECT JSON_AGG(a.name)
              FROM room_amenities ra
              JOIN amenities a ON a.id = ra.amenity_id
              WHERE ra.room_type_id = rt.id
          ) AS amenities

      FROM public.room_types rt
      LEFT JOIN room_bed_type       rbt ON rbt.id = rt.bed_type_id
      JOIN  public.room_properties  rp  ON rp.room_type_id = rt.id
      LEFT JOIN public.room_status  rs  ON rs.id = rp.status_id
      LEFT JOIN booked_counts       bc  ON bc.room_type_id = rt.id
      LEFT JOIN unavailable_counts  uc  ON uc.room_type_id = rt.id

      GROUP BY
          rt.id,
          rt.name,
          rt.price_per_night,
          rt.promotion_price_per_night,
          rt.description,
          rt.location,
          rt.image_main,
          rt.room_guest_adult,
          rt.room_guest_kid,
          rt.room_size,
          rbt.type_name
      ORDER BY rt.name;
    `;

    const result = await connectionPool.query(sql, params);

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("GET ROOMS ERROR:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}