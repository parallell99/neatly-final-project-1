import { orderRepository } from "./orderRepository";
import { AppError } from "@/utils/AppError";

/**
 * สร้าง order จาก user (จาก protect) และ body
 * ดึงราคาต่อคืนจาก DB (room_types) ไม่ใช้ Supabase
 */
async function createOrder(user, payload) {
  if (!user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const {
    room_type_id,
    check_in_date,
    check_out_date,
    quantity = 1,
    guest_id = null,
    promotion_id = null,
    additional_request = null,
  } = payload || {};

  if (!room_type_id || !check_in_date || !check_out_date) {
    throw new AppError("Missing required fields", 400);
  }

  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  const msPerDay = 24 * 60 * 60 * 1000;
  const nights = Math.round((checkOut - checkIn) / msPerDay);

  if (!Number.isFinite(nights) || nights <= 0) {
    throw new AppError("Invalid check-in/check-out dates", 400);
  }

  // ดึงราคาต่อคืนจาก database (room_types)
  const roomType = await orderRepository.getRoomTypePrice(room_type_id);

  if (!roomType) {
    throw new AppError("Room type not found", 404);
  }

  const nightlyPrice =
    roomType.promotion_price_per_night ?? roomType.price_per_night;

  if (nightlyPrice == null) {
    throw new AppError("Room price not configured", 400);
  }

  const qty = Number(quantity || 1);
  const totalPrice = Number(nightlyPrice) * nights * qty;

  // กำหนดเวลาหมดอายุสำหรับการชำระเงิน 5 นาทีหลังจากสร้าง order
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const order = await orderRepository.createOrder({
    userId: user.id,
    email: user.email ?? null,
    roomTypeId: room_type_id,
    checkInDate: check_in_date,
    checkOutDate: check_out_date,
    totalPrice,
    quantity: qty,
    guestId: guest_id,
    promotionId: promotion_id,
    additionalRequest: additional_request,
    status: "pending",
    expiresAt,
  });

  return order;
}

export const orderService = { createOrder };