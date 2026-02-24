import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "GET") return handleGet(req, res);
  return res.status(405).json({ error: "Method Not Allowed" });
}

async function handleGet(req, res) {
  try {
    const { checkIn, checkOut } = req.query;

    let sql = `
      SELECT
        id,
        user_id,
        room_id,
        check_in_date,
        check_out_date,
        total_price,
        status,
        created_at,
        payment_intent_id,
        expires_at
      FROM orders
    `;

    const params = [];

    // filter เฉพาะเมื่อส่งมาครบ 2 ค่า
    if (checkIn && checkOut) {
      params.push(checkIn, checkOut);
      sql += `
        WHERE check_in_date < $2::date
          AND check_out_date > $1::date
      `;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await connectionPool.query(sql, params);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}