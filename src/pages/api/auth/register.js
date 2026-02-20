import {authService} from "@/services/authService";
import { validateRegister } from "@/middleware/validation";

export default async function handler(req, res) {

  // เช็ค method ก่อน (Pages Router ต้องเช็คเอง)
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    // validate layer
    const validationError = validateRegister(req.body);
    if (validationError) {
      return res.status(validationError.status).json({
        error: validationError.message,
      });
    }

    // call service
    const result = await authService.register(req.body);

    return res.status(201).json({
      message: "Register successfully",
      data: result,
    });


  } catch (error) {
    console.error("REGISTER ERROR:", error);
  
    return res.status(error.status || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
  
}
