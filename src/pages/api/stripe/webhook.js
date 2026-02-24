import { stripe } from "@/lib/stripe";
import { buffer } from "micro";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBookingConfirmationEmail } from "@/lib/resendEmail";
import connectionPool from "@/utils/db";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(str) {
  return typeof str === "string" && UUID_REGEX.test(str.trim());
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔒 STEP 1: Insert event (กัน duplicate ด้วย UNIQUE) 
  try {
    const { error: insertError } = await supabaseAdmin
      .from("stripe_webhook_logs")
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event,
        processed: false,
      });

    if (insertError) {
      // ถ้า duplicate → ถือว่า processed แล้ว
      if (insertError.code === "23505") {
        return res.status(200).end();
      }

      console.error(insertError);
      return res.status(500).end();
    }
  } catch (e) {
    console.error("[webhook] stripe_webhook_logs insert failed:", e);
    return res.status(500).json({ error: "Failed to log webhook event" });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("status, email_sent, email")
        .eq("id", orderId)
        .single();

      if (!order) return;

      // ถ้าจ่ายแล้ว → ไม่ต้องทำอะไร
      if (order.status === "paid") {
        return;
      }

      // update 
      await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_method: "card",
          payment_intent_id: paymentIntent.id,
        })
        .eq("id", orderId);


      if (!order.email_sent && email) {
        await sendBookingConfirmationEmail({
          to: email,
          orderId,
          amount: paymentIntent.amount_received ?? 0,
        });
        await supabaseAdmin
          .from("orders")
          .update({ email_sent: true })
          .eq("id", orderId);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const rawOrderId = paymentIntent.metadata?.order_id;
      const orderId = rawOrderId && isUuid(rawOrderId) ? rawOrderId : null;
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (!order) return;

      if (order.status !== "paid") {
        await supabaseAdmin
          .from("orders")
          .update({ status: "awaiting_payment" })
          .eq("id", orderId);
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const rawOrderId = pi.metadata?.order_id;
        const orderId = rawOrderId && isUuid(rawOrderId) ? rawOrderId : null;
        if (orderId) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "refunded" })
            .eq("id", orderId);
        }
      }
    }

    // ✅ mark processed
    try {
      await supabaseAdmin
        .from("stripe_webhook_logs")
        .update({ processed: true })
        .eq("event_id", event.id);
    } catch {
      // ข้ามถ้า table ไม่อยู่หรือ permission ไม่พอ
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return res.status(500).send("Webhook processing failed");
  }
}