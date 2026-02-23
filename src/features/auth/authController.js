import { authService } from "./authService";
import { validateRegister, validateLogin } from "./validation";

export async function registerController(req, res) {
  const validationData = validateRegister(req.body);

  const result = await authService.register(validationData);

  return res.status(201).json({data: result});
}

export async function loginController(req, res) {
  const validationData = validateLogin(req.body);

  const { email, password } = validationData;

  const result = await authService.login(email, password);

  return res.status(200).json({data: result,});
}



export const authController ={
registerController,
loginController
}