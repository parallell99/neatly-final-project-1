import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        message:
          "Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    const { orderId, standards = [], extras = [] } = req.body ?? {};

    if (!orderId) {
      return res.status(400).json({ message: "Missing orderId" });
    }

    // ตรวจสอบว่า order นี้เป็นของ user คนนี้จริง ๆ
    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Fetch order failed:", orderError);
      return res.status(500).json({ message: "Failed to verify order" });
    }

    if (!orderRow) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1) map standard labels -> ids
    let standardInserts = [];
    if (Array.isArray(standards) && standards.length > 0) {
      const { data: standardRows, error: standardError } = await supabaseAdmin
        .from("standard_requests")
        .select("id, name")
        .in("name", standards);

      if (standardError) {
        console.error("Fetch standard_requests failed:", standardError);
        return res
          .status(500)
          .json({ message: "Failed to resolve standard requests" });
      }

      standardInserts = (standardRows ?? []).map((row) => ({
        order_id: orderId,
        standard_request_id: row.id,
      }));
    }

    // 2) map extras labels -> ids
    let extrasInserts = [];
    if (Array.isArray(extras) && extras.length > 0) {
      const { data: extraRows, error: extrasError } = await supabaseAdmin
        .from("extras_requests")
        .select("id, name")
        .in("name", extras);

      if (extrasError) {
        console.error("Fetch extras_requests failed:", extrasError);
        return res
          .status(500)
          .json({ message: "Failed to resolve extras requests" });
      }

      extrasInserts = (extraRows ?? []).map((row) => ({
        order_id: orderId,
        extra_request_id: row.id,
      }));
    }

    // 3) insert join rows (ถ้ามี)
    if (standardInserts.length > 0) {
      const { error: insertStandardError } = await supabaseAdmin
        .from("order_standard_requests")
        .insert(standardInserts);

      if (insertStandardError) {
        console.error(
          "Insert order_standard_requests failed:",
          insertStandardError
        );
        return res
          .status(500)
          .json({ message: "Failed to save standard requests" });
      }
    }

    if (extrasInserts.length > 0) {
      const { error: insertExtrasError } = await supabaseAdmin
        .from("order_extras_requests")
        .insert(extrasInserts);

      if (insertExtrasError) {
        console.error("Insert order_extras_requests failed:", insertExtrasError);
        return res
          .status(500)
          .json({ message: "Failed to save extras requests" });
      }
    }

    return res.status(200).json({
      success: true,
      standardCount: standardInserts.length,
      extrasCount: extrasInserts.length,
    });
  } catch (err) {
    console.error("order-requests unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

