import { stripe } from "@/lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentMethodId } = req.body;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}