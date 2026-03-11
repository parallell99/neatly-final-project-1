import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protectAndFetch } from "@/middlewares/protectAndFetch";
import { withRole } from "@/middlewares/role";
import { getOccupancyGuestController } from "@/features/occupancyGuest/occupancyGuestController";

export default withErrorHandler(
  withMethod(
    "GET",
    protectAndFetch(withRole("agent")(getOccupancyGuestController))
  )
);
