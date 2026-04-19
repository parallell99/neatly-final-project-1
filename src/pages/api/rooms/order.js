import { createOrderController } from "@/features/orders/orderController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";
import { protect } from "@/middlewares/protect";

export default withErrorHandler(
  withMethod("POST", protect(createOrderController))
);