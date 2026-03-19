import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import connectionPool from "@/utils/db";

function parseBaht(value) {
  if (value == null) return NaN;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    return Number.parseFloat(cleaned);
  }
  if (typeof value === "object") {
    // Handle possible Decimal-like objects
    if (typeof value.toNumber === "function") {
      const n = value.toNumber();
      return typeof n === "number" ? n : Number(n);
    }
    if (typeof value.toString === "function") {
      return parseBaht(value.toString());
    }
  }
  return Number(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, stripeCustomerId, totalPrice } = req.body;

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
    // Prefer price from caller (already includes extras & promotions),
    // fall back to order.total_price in DB.
    const rawTotal = totalPrice ?? order.total_price;
    const totalBaht = parseBaht(rawTotal);
    const amountSatang = Math.max(0, Math.round(totalBaht * 100));
    const MIN_THB_SATANG = 2000; // 20 THB (Stripe minimum for THB in many accounts)

    if (!Number.isFinite(totalBaht) || totalBaht <= 0) {
      return res.status(400).json({
        error: "Invalid order total_price (must be a positive number in THB)",
        total_price: rawTotal,
        total_price_type: typeof rawTotal,
        parsed_total_baht: totalBaht,
        amount_satang: amountSatang,
      });
    }

    if (amountSatang < MIN_THB_SATANG) {
      return res.status(400).json({
        error: "Amount is below Stripe minimum charge for THB",
        amountSatang,
        minimumSatang: MIN_THB_SATANG,
        parsed_total_baht: totalBaht,
      });
    }

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
        total_price: totalBaht,
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