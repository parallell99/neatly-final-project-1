import { fetchBookingsController } from "@/features/booking-history/bookingController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { protect } from "@/middlewares/protect";
import { withMethod } from "@/middlewares/withMethod";

export default withErrorHandler(
  withMethod("GET", protect(fetchBookingsController))
);