import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        message:
          "Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
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

    const { orderId, guestId, totalPrice } = req.body ?? {};

    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId" });
    }

    const update = {};
    if (guestId) update.guest_id = guestId;
    if (typeof totalPrice === "number") update.total_price = totalPrice;

    if (Object.keys(update).length === 0) {
      return res.status(200).json({ order: null });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Update order meta failed:", error);
      return res.status(500).json({ message: "Update order meta failed" });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error("update-order-meta unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

