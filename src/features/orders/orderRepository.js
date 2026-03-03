import connectionPool from "@/utils/db";

/**
 * ดึงราคาต่อคืนจากตาราง room_types (Postgres)
 * @returns {{ price_per_night: number, promotion_price_per_night: number | null } | null}
 */
async function getRoomTypePrice(roomTypeId) {
  const query = `
    SELECT price_per_night, promotion_price_per_night
    FROM room_types
    WHERE id = $1
  `;
  const { rows } = await connectionPool.query(query, [roomTypeId]);
  return rows[0] || null;
}

async function createOrder({
  userId,
  email,
  roomTypeId,
  checkInDate,
  checkOutDate,
  totalPrice,
  quantity,
  guestId,
  promotionId,
  additionalRequest,
  status,
  expiresAt,
}) {
  const query = `
    INSERT INTO orders (
      user_id,
      room_type_id,
      check_in_date,
      check_out_date,
      total_price,
      status,
      email,
      quantity,
      guest_id,
      promotion_id,
      additional_request,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `;

  const values = [
    userId,
    roomTypeId,
    checkInDate,
    checkOutDate,
    totalPrice,
    status,
    email,
    quantity,
    guestId,
    promotionId,
    additionalRequest,
    expiresAt,
  ];

  const { rows } = await connectionPool.query(query, values);
  return rows[0] || null;
}

export const orderRepository = { getRoomTypePrice, createOrder };