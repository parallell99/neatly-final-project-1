import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId" });
    }

    // 1️⃣ หา booking/order จาก Supabase
    const { data: order, error } = await supabaseAdmin
      .from("orders") 
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2️⃣ ถ้าจ่ายสำเร็จแล้ว
    if (order.payment_status === "paid") {
      return res.status(400).json({
        message: "Payment already completed",
      });
    }

    // 3️⃣ ดึง PaymentIntent จาก Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.payment_intent_id
    );

    // 4️⃣ ตรวจสอบสถานะ
    if (paymentIntent.status !== "requires_payment_method") {
      return res.status(400).json({
        message: `Cannot retry. Current status: ${paymentIntent.status}`,
      });
    }

    // 5️⃣ ส่ง client_secret กลับ
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.error("Retry payment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}