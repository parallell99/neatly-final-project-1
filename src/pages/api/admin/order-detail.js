import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/order-detail?id=xxx
 * Single order for Customer Booking Detail: guest, room_type, bed_type, payment.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawId = typeof req.query?.id === "string" ? req.query.id.trim() : null;
  if (!rawId) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", rawId)
      .maybeSingle();

    if (orderError) {
      console.error("[admin/order-detail] order error:", orderError);
      return res.status(500).json({ error: orderError.message || "Failed to load order" });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    let guest = null;
    if (order.guest_id) {
      const { data: g } = await supabaseAdmin
        .from("guests")
        .select("id, first_name, last_name")
        .eq("id", order.guest_id)
        .maybeSingle();
      if (g) guest = g;
    }

    let roomType = { name: "—", bedTypeName: "—" };
    if (order.room_type_id) {
      const { data: rt } = await supabaseAdmin
        .from("room_types")
        .select("id, name, bed_type_id")
        .eq("id", order.room_type_id)
        .maybeSingle();
      if (rt?.bed_type_id) {
        const { data: bed } = await supabaseAdmin
          .from("room_bed_type")
          .select("type_name")
          .eq("id", rt.bed_type_id)
          .maybeSingle();
        roomType = {
          name: rt.name || "—",
          bedTypeName: bed?.type_name || "—",
        };
      } else if (rt) {
        roomType = { name: rt.name || "—", bedTypeName: "—" };
      }
    }

    const customerName = guest
      ? `${guest.first_name || ""} ${guest.last_name || ""}`.trim() || "—"
      : (order.email || "—");
    const checkIn = order.check_in_date || null;
    const checkOut = order.check_out_date || null;
    let nights = 0;
    if (checkIn && checkOut) {
      const a = new Date(checkIn);
      const b = new Date(checkOut);
      nights = Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)));
    }

    const paymentMethod = order.payment_method === "card" ? "Credit Card" : (order.payment_method || "—");
    const cardLast4 = order.card_last4 ?? "888";

    return res.status(200).json({
      id: order.id,
      customerName,
      guests: order.quantity != null ? String(order.quantity) : "—",
      roomType: roomType.name,
      amount: order.quantity != null ? `${order.quantity} room` : "1 room",
      bedType: roomType.bedTypeName,
      checkIn,
      checkOut,
      stayNights: nights,
      bookingDate: order.created_at || null,
      totalPrice: order.total_price,
      paymentMethod,
      cardLast4,
      additionalRequest: order.additional_request ?? "",
      roomTypeName: roomType.name,
    });
  } catch (err) {
    console.error("[admin/order-detail] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load order" });
  }
}
