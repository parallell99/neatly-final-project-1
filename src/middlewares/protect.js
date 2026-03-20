import { AppError } from "@/utils/AppError";

import { authService } from "@/features/auth/authService";

export function protect  (handler)  {
    return async (req, res) => {
      const authHeader = req.headers.authorization;
  
      if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError("Unauthorized", 401);
      }
  
      const token = authHeader.split(" ")[1];
      const profile = await authService.getUserByToken(token);
      req.user = profile;
  
      return handler(req, res);
    };
  };