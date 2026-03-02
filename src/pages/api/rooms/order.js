// // pages/api/orders.js
// import { createClient } from "@supabase/supabase-js";

// // supabase admin client (ใช้ service role key เพื่อ insert ได้โดยไม่ติด RLS)
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   // ── 1. ตรวจสอบ user จาก Authorization header ──
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "Unauthorized: No token provided" });
//   }

//   const token = authHeader.replace("Bearer ", "");

//   // ดึง user จาก Supabase โดยใช้ JWT token
//   const {
//     data: { user },
//     error: authError,
//   } = await supabaseAdmin.auth.getUser(token);

//   if (authError || !user) {
//     return res.status(401).json({ error: "Unauthorized: Invalid token" });
//   }

//   // ── 2. รับ body ──
//   const { room_type_id, check_in_date, check_out_date, quantity } = req.body;

//   if (!room_type_id || !check_in_date || !check_out_date) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   if (new Date(check_out_date) <= new Date(check_in_date)) {
//     return res.status(400).json({ error: "check_out_date must be after check_in_date" });
//   }

//   // ── 3. Insert order ──
//   const { data, error } = await supabaseAdmin
//     .from("orders")
//     .insert([
//       {
//         user_id: user.id,
//         room_type_id,
//         check_in_date,
//         check_out_date,
//         quantity: quantity ?? 1,
//         status: "pending",
//         total_price: 0, // คำนวณ price ที่นี่ หรือจะ calculate ก่อน insert ก็ได้
//       },
//     ])
//     .select()
//     .single();

//   if (error) {
//     console.error("Insert order error:", error);
//     return res.status(500).json({ error: error.message });
//   }

//   return res.status(201).json({ data });
// }


import { createOrderController } from "@/features/orders/orderController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protect } from "@/middlewares/protect";

export default withErrorHandler(
  withMethod("POST", protect(createOrderController))
);