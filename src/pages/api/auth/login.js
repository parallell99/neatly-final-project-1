import { loginController } from "@/features/auth/authController";
import { withErrorHandler } from "@/utils/withErrorHandler";
import { withMethod } from "@/middlewares/withMethod";


export default withErrorHandler(
  withMethod("POST", loginController)
);