import { updateAvatarController } from "@/features/user/userController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { protect } from "@/middlewares/protect";
import { withMethod } from "@/middlewares/withMethod";

export default withErrorHandler(
  withMethod("PATCH", protect(updateAvatarController))
);