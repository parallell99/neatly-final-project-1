import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/admin/orders-list
 * List orders for admin Customer Booking: only status = 'paid', join guests (first_name → customerName), room_types, bed_type.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const selectOrders =
      "id, guest_id, user_id, email, room_type_id, check_in_date, check_out_date, total_price, quantity, created_at";

    let orders = null;
    let ordersError = null;

    const ordersRes = await supabaseAdmin
      .from("orders")
      .select(`${selectOrders}, guests(id, first_name, last_name)`)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    orders = ordersRes.data;
    ordersError = ordersRes.error;

    if (ordersError) {
      const fallbackRes = await supabaseAdmin
        .from("orders")
        .select(selectOrders)
        .eq("status", "paid")
        .order("created_at", { ascending: false });
      if (fallbackRes.error) {
        console.error("[admin/orders-list] orders error:", fallbackRes.error);
        return res.status(500).json({ error: fallbackRes.error.message || "Failed to load orders" });
      }
      orders = fallbackRes.data;
      ordersError = null;
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({ data: [] });
    }

    let guestsMap = {};
    const hasEmbeddedGuests = orders.some((o) => o.guests != null);
    if (!hasEmbeddedGuests) {
      const guestIds = [...new Set(orders.map((o) => o.guest_id).filter(Boolean))];
      if (guestIds.length > 0) {
        const guestsRes = await supabaseAdmin.from("guests").select("id, first_name, last_name").in("id", guestIds);
        if (guestsRes.data && guestsRes.data.length > 0) {
          (guestsRes.data || []).forEach((g) => {
            if (g.id == null) return;
            const k = String(g.id);
            guestsMap[k] = g;
            guestsMap[k.toLowerCase()] = g;
          });
        }
      }
    }

    const roomTypeIds = [...new Set(orders.map((o) => o.room_type_id).filter(Boolean))];
    const roomTypesRes =
      roomTypeIds.length > 0
        ? await supabaseAdmin.from("room_types").select("id, name, bed_type_id").in("id", roomTypeIds)
        : { data: [] };

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
      let first = "";
      if (o.guests != null) {
        const g = Array.isArray(o.guests) ? o.guests[0] : o.guests;
        if (g && typeof g === "object") first = g.first_name ?? g.firstName ?? "";
      }
      if (!first && o.guest_id) {
        const g = guestsMap[o.guest_id] ?? guestsMap[String(o.guest_id).toLowerCase()];
        if (g) first = g.first_name ?? g.firstName ?? "";
      }
      const customerName = String(first).trim() || "—";
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
        createdAt: o.created_at || null,
      };
    });

    return res.status(200).json({ data });
  } catch (err) {
    console.error("[admin/orders-list] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load orders" });
  }
}
