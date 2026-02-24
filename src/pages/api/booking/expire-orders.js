import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  await supabaseAdmin
    .from("orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  return Response.json({ success: true });
}