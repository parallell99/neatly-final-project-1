import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      message:
        "Supabase env vars missing. Set SUPABASE_URL/SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ message: "Invalid user" });
  }

  const {
    roomId,
    totalPrice,
    paymentMethod,
    paymentIntentId,
    guestId,
    promotionId,
    additionalRequest,
  } = req.body;

  // 🎯 กำหนด status ตาม payment method
  // ตอนนี้ทั้ง credit card และ cash จะเริ่มต้นที่สถานะ "paid"
  // (เนื่องจาก flow การจ่ายเงินถูก handle แยกแล้ว)
  let orderStatus = "paid";

  // ✅ insert order พร้อม status + ฟิลด์เสริมให้ตรงกับ schema ตาราง orders
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      // roomId จาก frontend แมปเข้า room_type_id ในตาราง orders
      room_type_id: roomId,
      total_price: totalPrice,
      email: user.email,
      status: orderStatus,
      payment_intent_id: paymentIntentId ?? null,
      guest_id: guestId ?? null,
      promotion_id: promotionId ?? null,
      additional_request: additionalRequest ?? null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Create order failed" });
  }

  return res.status(200).json({ order });
}