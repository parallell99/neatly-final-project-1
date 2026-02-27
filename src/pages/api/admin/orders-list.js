import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/orders-list
 * List orders for admin Customer Booking: join guests, room_types, bed_type.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, guest_id, user_id, email, room_type_id, check_in_date, check_out_date, total_price, quantity, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[admin/orders-list] orders error:", ordersError);
      return res.status(500).json({ error: ordersError.message || "Failed to load orders" });
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const guestIds = [...new Set(orders.map((o) => o.guest_id).filter(Boolean))];
    const roomTypeIds = [...new Set(orders.map((o) => o.room_type_id).filter(Boolean))];

    const [guestsRes, roomTypesRes] = await Promise.all([
      guestIds.length > 0
        ? supabaseAdmin.from("guests").select("id, first_name, last_name").in("id", guestIds)
        : { data: [] },
      roomTypeIds.length > 0
        ? supabaseAdmin.from("room_types").select("id, name, bed_type_id").in("id", roomTypeIds)
        : { data: [] },
    ]);

    const guestsMap = (guestsRes.data || []).reduce((acc, g) => {
      acc[g.id] = { first_name: g.first_name || "—", last_name: g.last_name || "" };
      return acc;
    }, {});

    const bedTypeIds = [...new Set((roomTypesRes.data || []).map((r) => r.bed_type_id).filter(Boolean))];
    let bedTypeMap = {};
    if (bedTypeIds.length > 0) {
      const { data: bedRows } = await supabaseAdmin
        .from("room_bed_type")
        .select("id, type_name")
        .in("id", bedTypeIds);
      bedTypeMap = (bedRows || []).reduce((acc, b) => {
        acc[b.id] = b.type_name;
        return acc;
      }, {});
    }

    const roomTypesMap = (roomTypesRes.data || []).reduce((acc, r) => {
      acc[r.id] = {
        name: r.name || "—",
        bedTypeName: r.bed_type_id ? bedTypeMap[r.bed_type_id] ?? "—" : "—",
      };
      return acc;
    }, {});

    const data = orders.map((o) => {
      const guest = o.guest_id ? guestsMap[o.guest_id] : null;
      const customerName = guest ? guest.first_name : (o.email || "—");
      const rt = o.room_type_id ? roomTypesMap[o.room_type_id] : { name: "—", bedTypeName: "—" };
      return {
        id: o.id,
        customerName,
        guests: o.quantity != null ? String(o.quantity) : "—",
        roomType: rt.name,
        amount: o.quantity != null ? String(o.quantity) : "1",
        bedType: rt.bedTypeName,
        checkIn: o.check_in_date || "—",
        checkOut: o.check_out_date || "—",
        totalPrice: o.total_price,
      };
    });

    return res.status(200).json({ data });
  } catch (err) {
    console.error("[admin/orders-list] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load orders" });
  }
}
