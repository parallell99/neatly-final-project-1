import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protect } from "@/middlewares/protect";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toLocalDateString(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function ensureCheckinReminderNotifications(userId) {
  // Create reminders for orders checking in tomorrow (idempotent).
  // This function must NEVER throw: notifications fetch should still succeed.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateString(tomorrow);

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("id, check_in_date")
    .eq("user_id", userId)
    .eq("status", "paid")
    .eq("check_in_date", tomorrowStr)
    .limit(50);

  if (ordersError || !orders?.length) {
    if (ordersError) console.error("[notifications] checkin-reminder orders error:", ordersError);
    return;
  }

  const orderIds = orders.map((o) => o.id);
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("notifications")
    .select("order_id")
    .eq("user_id", userId)
    .eq("type", "checkin_reminder")
    .in("order_id", orderIds);

  if (existingError) {
    console.error("[notifications] checkin-reminder existing error:", existingError);
    return;
  }

  const existingOrderIds = new Set((existing || []).map((n) => n.order_id));
  const toInsert = orders
    .filter((o) => !existingOrderIds.has(o.id))
    .map((o) => ({
      user_id: userId,
      order_id: o.id,
      type: "checkin_reminder",
      title: "Check-in reminder",
      message: "Your check-in is tomorrow at 2:00 PM. We look forward to welcoming you!",
      is_read: false,
      target_role: "user",
    }));

  if (toInsert.length === 0) return;
  const { error: insertError } = await supabaseAdmin.from("notifications").insert(toInsert);
  if (insertError) {
    console.error("[notifications] checkin-reminder insert error:", insertError);
  }
}

async function handler(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    // Avoid 304 (no body) and reduce cache weirdness on Vercel
    res.setHeader("Cache-Control", "no-store, max-age=0");

    try {
      await ensureCheckinReminderNotifications(userId);
    } catch (err) {
      // Never fail the endpoint because of reminder generation (cold start / transient issues)
      console.error("[notifications] ensureCheckinReminderNotifications failed:", err);
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[notifications] fetch error:", error);
      // Avoid breaking UI on transient Supabase/Vercel issues
      return res.status(200).json({ notifications: [] });
    }

    return res.status(200).json({ notifications: data || [] });
  }

  if (req.method === "PATCH") {
    const { id, markAll } = req.body || {};

    if (markAll) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        return res.status(500).json({ error: error.message || "Failed to mark all notifications as read" });
      }

      return res.status(200).json({ success: true });
    }

    if (!id) {
      return res.status(400).json({ error: "Missing notification id" });
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message || "Failed to mark notification as read" });
    }

    return res.status(200).json({ success: true });
  }
}

export default withErrorHandler(withMethod(["GET", "PATCH"], protect(handler)));

