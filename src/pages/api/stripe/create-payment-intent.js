import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    // 1️⃣ ดึง order จาก DB
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({ error: "Already paid" });
    }

    let customerId = order.customer_id;

    // 2️⃣ ถ้ายังไม่มี customer → สร้างใหม่
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: order.email,
        name: order.full_name,
      });

      customerId = customer.id;

      await supabaseAdmin
        .from("orders")
        .update({ customer_id: customerId })
        .eq("id", orderId);
    }

    // 3️⃣ สร้าง PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total_price, // ⚠️ ต้องเป็นหน่วยสตางค์
      currency: "thb",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session",
      metadata: {
        order_id: orderId,
      },
    });

    // 4️⃣ update order
    await supabaseAdmin
      .from("orders")
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: "pending",
      })
      .eq("id", orderId);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.error("Create payment error:", err);
    return res.status(500).json({ error: err.message });
  }
}