import { bookingService } from "./bookingService";

export async function fetchBookingsController(req, res) {
  const userId = req.user.id;
  const bookings = await bookingService.getBookingsByUserId(userId);

  return res.status(200).json({ bookings });
}

export const bookingController = {
  fetchBookingsController,
};