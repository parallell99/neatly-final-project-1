import { stripe } from "@/lib/stripe";
import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, email, name } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    // 1️⃣ เช็คก่อนว่ามี stripe_customer_id หรือยัง
    const { rows } = await connectionPool.query(
      `SELECT stripe_customer_id FROM users WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let customerId = rows[0].stripe_customer_id;

    // 2️⃣ ถ้ายังไม่มี → สร้างใหม่
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        name: name || undefined,
      });

      customerId = customer.id;

      await connectionPool.query(
        `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
        [customerId, userId]
      );
    }

    // 3️⃣ ส่งกลับเฉพาะ customerId
    return res.status(200).json({ customerId });

  } catch (error) {
    console.error("[create-customer]", error);
    return res.status(500).json({ error: error.message });
  }
}