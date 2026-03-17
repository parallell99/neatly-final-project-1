import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_STATUSES = ["cancelled", "refunded"];
const CANCELLABLE_STATUSES = ["paid", "pending", "awaiting_payment"];
const REFUNDABLE_STATUSES = ["paid"];

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

  const { orderId, status } = req.body ?? {};

  if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
    return res.status(400).json({ message: "Missing orderId" });
  }

  const newStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      message: "Invalid status. Allowed: cancelled, refunded",
    });
  }

  const allowedCurrentStatuses =
    newStatus === "refunded" ? REFUNDABLE_STATUSES : CANCELLABLE_STATUSES;

  const cancelDate = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: newStatus, cancel_date: cancelDate })
    .eq("id", orderId.trim())
    .eq("user_id", user.id)
    .in("status", allowedCurrentStatuses)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[update-order-status]", error);
    const msg = String(error?.message || "");
    if (msg.toLowerCase().includes("cancel_date") && msg.toLowerCase().includes("does not exist")) {
      return res.status(400).json({
        message: "Missing column orders.cancel_date in DB",
        missingColumnsSql: "ALTER TABLE orders ADD COLUMN cancel_date timestamptz;",
      });
    }
    return res.status(500).json({ message: "Update order status failed" });
  }

  if (!data) {
    return res.status(404).json({
      message:
        newStatus === "refunded"
          ? "Order not found or cannot be refunded (must be paid and owned by you)"
          : "Order not found or cannot be cancelled (must be owned by you)",
    });
  }

  return res.status(200).json({ order: data });
}
