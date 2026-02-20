import { authService } from "@/services/authService";
import { validateLogin } from "@/middleware/validation";

export default async function handler(req, res) {

  // เช็ค method ก่อน (Pages Router ต้องเช็คเอง)
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    // validate layer
    const validationError = validateLogin(req.body);
    if (validationError) {
      return res.status(validationError.status).json({
        error: validationError.message,
      });
    }

    // call service
    const result = await authService.login(req.body.email, req.body.password);

    return res.status(200).json({
      message: "Login successfully",
      data: result,
    });


  } catch (error) {
    console.error("LOGIN ERROR:", error);
  
    return res.status(error.status || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
  
}