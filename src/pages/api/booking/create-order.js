import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // ใช้ anon client เพื่อ verify user
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ message: "Invalid user" });
  }

  // 🔥 insert order พร้อม email snapshot
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: user.id,
      room_id: req.body.roomId,
      total_price: req.body.totalPrice,
      email: user.email,   // ✅ snapshot ตอนจอง
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Create order failed" });
  }

  return res.status(200).json({ order });
}