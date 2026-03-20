import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { authService } from "@/features/auth/authService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(str) {
  return typeof str === "string" && UUID_REGEX.test(str.trim());
}

async function handler(req, res) {
  const rawOrderId = typeof req.query?.orderId === "string" ? req.query.orderId.trim() : null;
  const orderId = rawOrderId && isUuid(rawOrderId) ? rawOrderId : null;
  let userId = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const user = await authService.getUserByToken(authHeader.split(" ")[1]);
      if (user?.id) userId = user.id;
    } catch {
      // token invalid/expired — continue as guest
    }
  }

  if (!userId && !orderId) {
    return res.status(200).json({ order: null, room: null });
  }

  let order = null;
  try {
    if (orderId) {
      let q = supabaseAdmin
        .from("orders")
        .select("id, check_in_date, check_out_date, total_price, expires_at, room_type_id, user_id, quantity, created_at")
        .eq("id", orderId);
      if (userId) q = q.eq("user_id", userId);
      const { data: orderRows, error: orderError } = await q.maybeSingle();
      if (orderError) throw orderError;
      order = orderRows ?? null;
    } else if (userId) {
      const { data: orderRows, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, check_in_date, check_out_date, total_price, expires_at, room_type_id, user_id, quantity, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (orderError) throw orderError;
      order = orderRows ?? null;
    }
  } catch (err) {
    console.error("[order-detail] order fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }

  if (!order) {
    return res.status(200).json({ order: null, room: null });
  }

  let room = null;
  if (order.room_type_id) {
    try {
      const { data: roomRow, error: roomError } = await supabaseAdmin
        .from("room_types")
        .select("name, price_per_night, promotion_price_per_night, image_main")
        .eq("id", order.room_type_id)
        .maybeSingle();
      if (!roomError && roomRow) room = roomRow;
    } catch (err) {
      console.error("[order-detail] room fetch error:", err);
    }
  }

  return res.status(200).json({ order, room });
}

export default withErrorHandler(withMethod("GET", handler));
