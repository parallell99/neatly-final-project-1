import { stripe } from "@/lib/stripe";

export default async function handler(req, res) {
  // #region agent log
  fetch('http://127.0.0.1:7447/ingest/a40799b2-6c37-45b3-85a5-91c821958353',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27948e'},body:JSON.stringify({sessionId:'27948e',runId:'pre-fix',hypothesisId:'D',location:'src/pages/api/stripe/create-setup-intent.js:4',message:'Handler entered',data:{method:req.method},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { stripeCustomerId } = req.body;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "Missing customer id" });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (err) {
    console.error("Create setup intent error:", err);
    return res.status(500).json({ error: err.message });
  }
}

