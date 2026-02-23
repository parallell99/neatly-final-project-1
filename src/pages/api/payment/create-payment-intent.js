import { stripe } from "@/lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
    }

    const { amount, stripeCustomerId, userId, orderId } = req.body;
    const amountNum = typeof amount === "number" ? amount : parseInt(amount, 10);
    if (!Number.isInteger(amountNum) || amountNum < 50) {
      return res.status(400).json({
        error: "Invalid amount. Minimum 50 satang (0.50 THB) required.",
      });
    }

    const params = {
      amount: amountNum,
      currency: "thb",
      payment_method_types: ["card", "promptpay"],
      metadata: {
        user_id: userId || "guest",
        order_id: orderId || "pending",
      },
    };

    if (stripeCustomerId) {
      params.customer = stripeCustomerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("[create-payment-intent]", error);
    res.status(500).json({
      error: error.message || "Payment intent creation failed",
      type: error.type,
    });
  }
}