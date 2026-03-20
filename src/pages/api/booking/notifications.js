import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protect } from "@/middlewares/protect";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/booking/notifications
 * แจ้งเตือนสำหรับ user: (1) รับคำขอ refund (2) จ่ายเงินสำเร็จ (3) เตือน check-in ล่วงหน้า 1 วัน
 * ลำดับแสดง: check-in → refund request → payment success
 */
async function handler(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateString(tomorrow);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = toLocalDateString(sevenDaysAgo);

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = toLocalDateString(fourteenDaysAgo);

  try {
    const { data: paidOrders, error: paidError } = await supabaseAdmin
      .from("orders")
      .select("id, check_in_date, check_out_date, room_type_id, created_at")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (paidError) {
      console.error("[booking/notifications] paid orders error:", paidError);
      return res.status(500).json({ error: paidError.message || "Failed to load notifications" });
    }

    const { data: refundedOrders, error: refundError } = await supabaseAdmin
      .from("orders")
      .select("id, room_type_id, updated_at, created_at")
      .eq("user_id", userId)
      .eq("status", "refunded")
      .order("updated_at", { ascending: false });

    if (refundError) {
      console.error("[booking/notifications] refunded orders error:", refundError);
    }

    const allOrderIds = [
      ...(paidOrders || []).map((o) => o.id),
      ...(refundedOrders || []).map((o) => o.id),
    ];
    const roomTypeIds = [...new Set(allOrderIds.length ? [
      ...(paidOrders || []).map((o) => o.room_type_id),
      ...(refundedOrders || []).map((o) => o.room_type_id),
    ].filter(Boolean) : [])];

    const roomTypesMap = {};
    let galleryByRoomType = {};
    if (roomTypeIds.length > 0) {
      const { data: roomTypesRows } = await supabaseAdmin
        .from("room_types")
        .select("id, name, image_main")
        .in("id", roomTypeIds);
      (roomTypesRows || []).forEach((r) => {
        roomTypesMap[r.id] = { name: r.name || "Room", image_main: r.image_main || null };
      });
      const { data: galleryRows } = await supabaseAdmin
        .from("image_gallery")
        .select("room_type_id, image_url")
        .in("room_type_id", roomTypeIds)
        .order("id", { ascending: true });
      (galleryRows || []).forEach((row) => {
        if (!galleryByRoomType[row.room_type_id]) galleryByRoomType[row.room_type_id] = row.image_url;
      });
    }

    const defaultImageUrl = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=80&h=80&fit=crop";
    const getImageUrl = (roomTypeId) => {
      const room = roomTypeId ? roomTypesMap[roomTypeId] : null;
      return room?.image_main || (roomTypeId && galleryByRoomType[roomTypeId]) || defaultImageUrl;
    };

    const notifications = [];
    const seenCheckIn = new Set();
    const seenPayment = new Set();
    const seenRefund = new Set();

    // 1) Refund request – แจ้งก่อน (order ที่ status = refunded ล่าสุด 14 วัน)
    (refundedOrders || []).forEach((order) => {
      const updatedStr = order.updated_at ? String(order.updated_at).slice(0, 10) : null;
      if (updatedStr && updatedStr >= fourteenDaysAgoStr && !seenRefund.has(order.id)) {
        seenRefund.add(order.id);
        notifications.push({
          id: `refund-${order.id}`,
          type: "refund_request",
          message: "We receive your refund request. You will receive an email with details and refund within 48 hours.",
          imageUrl: getImageUrl(order.room_type_id),
          orderId: order.id,
          sortAt: order.updated_at || order.created_at,
        });
      }
    });

    // 2) Check-in พรุ่งนี้
    (paidOrders || []).forEach((order) => {
      const orderDate = order.check_in_date ? String(order.check_in_date).slice(0, 10) : null;
      if (orderDate === tomorrowStr && !seenCheckIn.has(order.id)) {
        seenCheckIn.add(order.id);
        const room = order.room_type_id ? roomTypesMap[order.room_type_id] : null;
        const roomName = room?.name || "Room";
        const checkInFormatted = formatCheckInDate(order.check_in_date);
        notifications.push({
          id: `checkin-${order.id}`,
          type: "check_in_reminder",
          message: `Tomorrow is your check-in date with ${roomName} '${checkInFormatted}'. We will wait for your arrival!`,
          imageUrl: getImageUrl(order.room_type_id),
          orderId: order.id,
          checkInDate: order.check_in_date,
          sortAt: order.created_at || order.check_in_date,
        });
      }
    });

    // 3) Payment success – แจ้งหลัง refund (order paid ล่าสุด 7 วัน)
    (paidOrders || []).forEach((order) => {
      const createdStr = order.created_at ? String(order.created_at).slice(0, 10) : null;
      if (createdStr && createdStr >= sevenDaysAgoStr && !seenPayment.has(order.id)) {
        seenPayment.add(order.id);
        const room = order.room_type_id ? roomTypesMap[order.room_type_id] : null;
        const roomName = room?.name || "Room";
        notifications.push({
          id: `payment-${order.id}`,
          type: "payment_success",
          message: `Your payment was successful for ${roomName}. Check-in: ${order.check_in_date ? String(order.check_in_date).slice(0, 10) : "—"}.`,
          imageUrl: getImageUrl(order.room_type_id),
          orderId: order.id,
          sortAt: order.created_at,
        });
      }
    });

    // ลำดับ: แจ้งเตือนล่าสุดอยู่ข้างบน (เรียงตาม sortAt ใหม่ไปเก่า)
    notifications.sort((a, b) => {
      const tA = a.sortAt ? new Date(a.sortAt).getTime() : 0;
      const tB = b.sortAt ? new Date(b.sortAt).getTime() : 0;
      return tB - tA;
    });

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("[booking/notifications] ERROR:", err);
    return res.status(500).json({ error: err.message || "Failed to load notifications" });
  }
}

function toLocalDateString(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCheckInDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const date = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}, ${date} ${month} ${year}`;
}

export default withErrorHandler(withMethod("GET", protect(handler)));
