import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, stripeCustomerId } = req.body;

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

    // 2️⃣ เลือก customer ให้ตรงกับ user ปัจจุบัน (ถ้ามี)
    let customerId = stripeCustomerId || order.customer_id;

    // ถ้ามี stripeCustomerId แต่ยังไม่ได้ผูกกับ order ให้ update ไว้
    if (stripeCustomerId && stripeCustomerId !== order.customer_id) {
      await supabaseAdmin
        .from("orders")
        .update({ customer_id: stripeCustomerId })
        .eq("id", orderId);
    }

    // ถ้ายังไม่มี customer เลย → สร้างใหม่จากข้อมูล order
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

    // ผูก stripe_customer_id กับ user เพื่อให้ครั้งถัดไปโหลดบัตรที่บันทึกได้
    if (order.user_id && customerId) {
      try {
        await connectionPool.query(
          `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
          [customerId, order.user_id]
        );
      } catch (userUpdateErr) {
        console.error("Failed to update user stripe_customer_id:", userUpdateErr);
      }
    }

    // 3️⃣ สร้าง PaymentIntent
    const totalBaht = Number(order.total_price ?? 0) || 0;
    const amountSatang = Math.max(0, Math.round(totalBaht * 100));

    const paymentIntent = await stripe.paymentIntents.create({
      // Stripe expects the smallest currency unit (satang for THB)
      amount: amountSatang,
      currency: "thb",
      customer: customerId,
      payment_method_types: ["card"],
      setup_future_usage: "off_session",
      metadata: {
        order_id: orderId,
      },
    });

    // 4️⃣ update order ให้ผูกกับ payment_intent_id
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_intent_id: paymentIntent.id,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order with payment_intent_id:", updateError);
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.error("Create payment error:", err);
    return res.status(500).json({ error: err.message });
  }
}