import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

function isValidISODateOnly(str) {
  return typeof str === "string" && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function toLocalDate(dateStr) {
  // Treat YYYY-MM-DD as local to avoid timezone shifting.
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

  const { orderId, checkInDate, checkOutDate } = req.body ?? {};

  if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
    return res.status(400).json({ message: "Missing orderId" });
  }
  if (!isValidISODateOnly(checkInDate) || !isValidISODateOnly(checkOutDate)) {
    return res.status(400).json({
      message: "Invalid dates. Expected YYYY-MM-DD for checkInDate/checkOutDate",
    });
  }

  const inDate = toLocalDate(checkInDate);
  const outDate = toLocalDate(checkOutDate);
  if (!inDate || !outDate || outDate.getTime() <= inDate.getTime()) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
    })
    .eq("id", orderId.trim())
    .eq("user_id", user.id)
    .in("status", ["paid"])
    .select()
    .maybeSingle();

  if (error) {
    console.error("[update-order-dates]", error);
    return res.status(500).json({ message: "Update order dates failed" });
  }

  if (!data) {
    return res.status(404).json({
      message: "Order not found or cannot be updated (must be paid and owned by you)",
    });
  }

  return res.status(200).json({ order: data });
}

