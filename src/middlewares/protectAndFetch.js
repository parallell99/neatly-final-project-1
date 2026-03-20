/**
 * Role-based middleware - ใช้ร่วมกับ protectMiddleware
 * ต้องวาง protectMiddleware ก่อนเสมอ เพื่อให้ req.user มีค่า
 * example usage
 * router.get("/admin", protectMiddleware, restrictTo("admin"), controller);
 * router.get("/profile", protectMiddleware, restrictTo("user", "admin"), controller);

 */
import { AppError } from "@/utils/AppError";

import { authService } from "@/features/auth/authService";
import { userService } from "@/features/user/userService";
export function protectAndFetch(handler) {
    return async (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw new AppError("Unauthorized", 401);
        }

        const token = authHeader.split(" ")[1];

        const authUser = await authService.getUserByToken(token);

        if (!authUser) {
            throw new AppError("Invalid token", 401);
        }

        const dbUser = await userService.getUserById(authUser.id)
        if (!dbUser) {
            throw new AppError("User not found", 404);
        }

        req.user = dbUser;

        return handler(req, res);
    };
}