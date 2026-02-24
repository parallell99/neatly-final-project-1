import { stripe } from "@/lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { stripeCustomerId } = req.query;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "Missing customer id" });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    res.status(200).json(paymentMethods.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}