import { getBookingTrendsController } from "@/features/bookingTrends/bookingTrendsController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protectAndFetch } from "@/middlewares/protectAndFetch";
import { withRole } from "@/middlewares/role";

export default withErrorHandler(
  withMethod("GET", protectAndFetch(withRole("agent")(getBookingTrendsController)))
);

