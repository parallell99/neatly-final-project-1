import connectionPool from "@/utils/db";

async function findByUserId(userId) {
  const query = `
SELECT
  o.id,
  o.check_in_date,
  o.check_out_date,
  o.total_price,
  o.quantity,
  o.created_at,
  o.additional_request,
  o.card_brand,
  o.card_last4,

  rt.name AS room_name,
  rt.image_main AS room_image,
  rt.promotion_price_per_night,

  p.code AS promotion_code,
    p.discount_type,
    p.discount_value,
    p.max_discount,

  COALESCE(
    json_agg(
      json_build_object(
        'name', er.name,
        'price', er.price
      )
    ) FILTER (WHERE er.name IS NOT NULL),
    '[]'
  ) AS extras

FROM orders o

LEFT JOIN room_types rt
ON rt.id = o.room_type_id

LEFT JOIN promotion_usages pu
ON pu.order_id = o.id

LEFT JOIN promotions p
ON p.id = pu.promotion_id

LEFT JOIN order_extras_requests oer
ON oer.order_id = o.id

LEFT JOIN extras_requests er
ON er.id = oer.extra_request_id

WHERE o.user_id = $1

GROUP BY
  o.id,
  o.check_in_date,
  o.check_out_date,
  o.total_price,
  o.quantity,
  o.created_at,
  o.additional_request,
  o.card_brand,
  o.card_last4,
  rt.name,
  rt.image_main,
  rt.promotion_price_per_night,
  p.code,
  p.discount_type,
  p.discount_value,
  p.max_discount
ORDER BY o.created_at DESC
  `;
  console.log("1");
  const { rows } = await connectionPool.query(query, [userId]);
  console.log("2");
  return rows;
}


export const bookingRepository = { findByUserId };