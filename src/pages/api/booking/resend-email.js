import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { orderId } = req.body;
    console.log("Incoming orderId:", orderId);

    if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
    }

    const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("*, room_properties(*)")
        .eq("id", orderId)
        .single();

    console.log("DB order:", order);
    console.log("DB error:", error);

    if (error || !order) {
        return res.status(404).json({ message: "Order not found" });
    }

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "neatlytestbooking@gmail.com",
        subject: "Booking Confirmation",
        html: `
      <h2>Booking Confirmed</h2>
      <p>Room: ${order.room_properties?.title}</p>
      <p>Total: ${order.total_price}</p>
    `,
    });

    return res.status(200).json({ success: true });
}