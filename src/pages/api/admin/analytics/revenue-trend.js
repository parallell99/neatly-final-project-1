import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protectAndFetch } from "@/middlewares/protectAndFetch";
import { withRole } from "@/middlewares/role";
import { getRevenueTrendController } from "@/features/revenueTrends/revenueTrendsController";

export default withErrorHandler(
  withMethod("GET", protectAndFetch(withRole("agent")(getRevenueTrendController)))
);

