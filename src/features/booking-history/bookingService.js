import { bookingRepository } from "./bookingRepository";
import { AppError } from "@/utils/AppError";

async function getBookingsByUserId(userId) {
  const rows = await bookingRepository.findByUserId(userId);

  return rows.map((order) => {
    const nights =
      (new Date(order.check_out_date) - new Date(order.check_in_date)) /
      (1000 * 60 * 60 * 24);

    const extras = order.extras ?? [];
    const extrasTotal = extras.reduce((sum, e) => sum + (e.price ?? 0), 0);

    const roomTotal = order.promotion_price_per_night * nights;
    const subtotal = roomTotal + extrasTotal;
    
    const discount =
      order.discount_type === "percent"
        ? Math.min(
            (subtotal * order.discount_value) / 100,
            order.max_discount ?? Infinity
          )
        : order.discount_value ?? 0;

    return {
      id: order.id,
      status: order.status,
      room: order.room_name,
      image: order.room_image,
      roomPrice: order.promotion_price_per_night,
      checkIn: order.check_in_date,
      checkOut: order.check_out_date,
      guests: order.quantity,
      nights,
      total: order.total_price,
      extras,
      extrasTotal,
      discount,
      payment:
      order.payment_method === "card"
        ? `${order.card_brand} •••• ${order.card_last4}`
        : null,
      request: order.additional_request,
      bookingDate: order.created_at,
      promotion_code: order.promotion_code,
      cancelDate: order.cancelDate,
    };
  });
}

export const bookingService = { getBookingsByUserId };