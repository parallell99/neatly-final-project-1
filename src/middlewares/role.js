/**
 * Role-based middleware - ใช้ร่วมกับ protectMiddleware
 * ต้องวาง protectMiddleware ก่อนเสมอ เพื่อให้ req.user มีค่า
 * example usage
 * router.get("/admin", protectMiddleware, restrictTo("admin"), controller);
 * router.get("/profile", protectMiddleware, restrictTo("user", "admin"), controller);
 */
import { AppError } from "@/utils/AppError";

export function withRole  (...roles) {

    return (handler) => {
      return async (req, res) => {
        if (!roles.includes(req.user.role)) {
          console.log(req.user.role)
          throw new AppError("Unauthorized the data", 403);
        }

        return handler(req, res);
      };
    };
  };