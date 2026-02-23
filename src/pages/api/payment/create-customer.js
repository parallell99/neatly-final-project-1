import { stripe } from "@/lib/stripe";
import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, email, name } = req.body;

  try {
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
    });

    // อัปเดต stripe_customer_id ในตาราง users เดียวกับที่ authRepository อ่าน
    const { rowCount } = await connectionPool.query(
      `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
      [customer.id, userId]
    );

    if (rowCount === 0) {
      console.warn("[create-customer] No user row updated for id:", userId);
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error("[create-customer]", error);
    res.status(500).json({ error: error.message });
  }
}