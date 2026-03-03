import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1️⃣ ดึง token จาก header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2️⃣ สร้าง client ด้วย ANON KEY (ใช้ validate JWT เท่านั้น)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        message:
          "Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 3️⃣ ตรวจสอบ user จาก token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // 4️⃣ รับค่า additional_request + orderId จาก body
    const { orderId, additional_request } = req.body ?? {};

    if (!orderId || !additional_request) {
      return res.status(400).json({
        message: "Missing required fields: orderId, additional_request",
      });
    }

    // 5️⃣ อัปเดตฟิลด์ additional_request ในตาราง orders
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        additional_request: String(additional_request).trim(),
      })
      .eq("id", orderId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update additional_request failed:", error);
      return res.status(500).json({ message: "Update additional_request failed" });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}