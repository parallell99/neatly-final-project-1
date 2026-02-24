import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmationEmail({
  to,
  orderId,
  amount,
}) {
  await resend.emails.send({
    from: "Booking <onboarding@resend.dev>",
    to,
    subject: "Your booking is confirmed 🎉",
    html: `
      <h1>Booking Confirmed</h1>
      <p>Order ID: ${orderId}</p>
      <p>Amount Paid: ${amount / 100} THB</p>
      <p>Thank you for your booking.</p>
    `,
  });
}