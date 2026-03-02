import { orderService } from "./orderService";

export async function createOrderController(req, res) {
  const order = await orderService.createOrder(req.user, req.body);
  return res.status(201).json({ data: order });
}