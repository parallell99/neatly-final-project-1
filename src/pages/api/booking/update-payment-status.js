import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return res.status(401).json({ message: "Invalid user" });
  }

  const { orderId, status, paymentMethod } = req.body;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status,
      payment_method: paymentMethod,
    })
    .eq("id", orderId)
    .eq("user_id", user.id)
    // อัปเดตได้เฉพาะ order ที่ยังไม่จ่ายสำเร็จ (pending / awaiting_payment)
    .in("status", ["pending", "awaiting_payment"])
    // อัปเดตได้เฉพาะ order ที่ยังไม่จ่ายสำเร็จ (pending / awaiting_payment)
    .in("status", ["pending", "awaiting_payment"])
    .select()
    .maybeSingle();
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: "Update failed" });
  }

  return res.status(200).json({ order: data });
}