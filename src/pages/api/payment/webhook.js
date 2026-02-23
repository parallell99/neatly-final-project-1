import { stripe } from "@/lib/stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

import { buffer } from "micro";

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

  // 🔥 PAYMENT SUCCESS
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // 1️⃣ update order status
    await db.orders.update({
      where: { id: paymentIntent.metadata.order_id },
      data: { status: "confirmed" },
    });

    // 2️⃣ save payment method
    if (paymentIntent.payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method
      );

      await db.saved_payment_methods.upsert({
        where: {
          stripe_payment_method_id: paymentMethod.id,
        },
        update: {},
        create: {
          user_id: paymentIntent.metadata.user_id,
          stripe_payment_method_id: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
          is_default: false,
        },
      });
    }
  }

  res.status(200).json({ received: true });
}