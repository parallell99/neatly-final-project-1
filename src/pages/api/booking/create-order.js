import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const { roomId, totalPrice, paymentMethod } = req.body;

  // 🎯 กำหนด status ตาม payment method
  let orderStatus = "pending";

  if (paymentMethod === "cash") {
    orderStatus = "awaiting_payment";
  }

  // ✅ insert order พร้อม status ที่ถูกต้องตั้งแต่แรก
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      room_id: roomId,
      total_price: totalPrice,
      email: user.email,
      status: orderStatus,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Create order failed" });
  }

  return res.status(200).json({ order });
}