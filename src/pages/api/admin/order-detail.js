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

    let roomType = { name: "—", bedTypeName: "—", pricePerNight: null, promotionPricePerNight: null };
    if (order.room_type_id) {
      const { data: rt } = await supabaseAdmin
        .from("room_types")
        .select("id, name, bed_type_id, price_per_night, promotion_price_per_night")
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
          pricePerNight: rt.price_per_night ?? null,
          promotionPricePerNight: rt.promotion_price_per_night ?? null,
        };
      } else if (rt) {
        roomType = {
          name: rt.name || "—",
          bedTypeName: "—",
          pricePerNight: rt.price_per_night ?? null,
          promotionPricePerNight: rt.promotion_price_per_night ?? null,
        };
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

    const quantity = order.quantity != null ? Number(order.quantity) || 1 : 1;
    const nightlyPrice =
      roomType.promotionPricePerNight != null
        ? Number(roomType.promotionPricePerNight) || 0
        : roomType.pricePerNight != null
          ? Number(roomType.pricePerNight) || 0
          : 0;
    const roomSubtotal = nightlyPrice * nights * quantity;

    // Extras for this order (order_extras_requests → extras_requests)
    let extras = [];
    const { data: orderExtrasRows } = await supabaseAdmin
      .from("order_extras_requests")
      .select("extra_request_id")
      .eq("order_id", rawId);
    const extraIds = (orderExtrasRows ?? []).map((r) => r.extra_request_id).filter(Boolean);
    if (extraIds.length > 0) {
      const { data: extraRows } = await supabaseAdmin
        .from("extras_requests")
        .select("id, name, price")
        .in("id", extraIds);
      extras = (extraRows ?? []).map((r) => ({
        name: r.name || "—",
        price: r.price != null ? Number(r.price) || 0 : 0,
      }));
    }
    const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);

    // ชื่อโปรโมชันจากตาราง promotions column "name" (รองรับหลายรูปแบบ key)
    function getPromotionNameFromRow(promo) {
      if (!promo || typeof promo !== "object") return null;
      const fromName = promo.name ?? promo.Name ?? promo["name"];
      if (fromName != null && String(fromName).trim() !== "") return String(fromName).trim();
      for (const key of ["code", "title", "promotion_name", "label"]) {
        const v = promo[key];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }
      const nameKey = Object.keys(promo).find((k) => k.toLowerCase() === "name");
      if (nameKey && promo[nameKey] != null && String(promo[nameKey]).trim() !== "")
        return String(promo[nameKey]).trim();
      return null;
    }

    const subtotalBeforePromo = roomSubtotal + extrasTotal;
    const orderTotal = Number(order.total_price) || 0;
    const impliedDiscount = Math.max(0, subtotalBeforePromo - orderTotal);

    let promotionCode = null;
    let promotionDiscount = 0;
    const promotionId = order.promotion_id ?? order.promo_id ?? null;

    if (promotionId) {
      const { data: promo, error: promoError } = await supabaseAdmin
        .from("promotions")
        .select("*")
        .eq("id", promotionId)
        .maybeSingle();
      if (promoError) {
        console.warn("[admin/order-detail] promotion fetch error:", promoError.message);
      }
      if (promo) {
        promotionCode = getPromotionNameFromRow(promo);
        const discountValue =
          promo.discount_percentage ??
          promo.fixed_amount ??
          promo.amount ??
          promo.discount ??
          0;
        const discountNum = Number(discountValue) || 0;
        if (discountNum > 0) {
          promotionDiscount =
            promo.discount_percentage != null
              ? (subtotalBeforePromo * discountNum) / 100
              : discountNum;
        }
      }
    }

    // มีส่วนลดแต่ยังไม่มีชื่อ → ดึงจาก promotions (จับคู่ส่วนลดหรือใช้แถวแรกที่มี column name)
    if (impliedDiscount > 0 && !promotionCode) {
      const { data: allPromos } = await supabaseAdmin
        .from("promotions")
        .select("*")
        .order("id", { ascending: true });
      const list = Array.isArray(allPromos) ? allPromos : [];
      for (const p of list) {
        const discountValue =
          p.discount_percentage ?? p.fixed_amount ?? p.amount ?? p.discount ?? 0;
        const num = Number(discountValue) || 0;
        const expectedDiscount =
          p.discount_percentage != null ? (subtotalBeforePromo * num) / 100 : num;
        if (Math.abs(expectedDiscount - impliedDiscount) < 1) {
          promotionCode = getPromotionNameFromRow(p);
          promotionDiscount = impliedDiscount;
          break;
        }
      }
      if (!promotionCode && list.length > 0) {
        for (const p of list) {
          promotionCode = getPromotionNameFromRow(p);
          if (promotionCode) {
            promotionDiscount = impliedDiscount;
            break;
          }
        }
        if (!promotionCode && list.length > 0) {
          const first = list[0];
          for (const k of Object.keys(first)) {
            if (!/name|code|title|label/i.test(k)) continue;
            const v = first[k];
            if (typeof v === "string" && v.trim().length > 0 && v.trim().length <= 200) {
              promotionCode = v.trim();
              promotionDiscount = impliedDiscount;
              break;
            }
          }
        }
      }
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
      roomSubtotal,
      extras,
      extrasTotal,
      promotionCode,
      promotionName: promotionCode,
      promotionDiscount,
    });
  } catch (err) {
    console.error("[admin/order-detail] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load order" });
  }
}
