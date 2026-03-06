import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ message: "Missing code" });
  }

  const trimmed = code.trim();

  if (!trimmed) {
    return res.status(400).json({ message: "Missing code" });
  }

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .eq("name", trimmed)
    .maybeSingle();

  if (error) {
    console.error("Fetch promotion failed:", error);
    return res.status(500).json({ message: "Failed to load promotion" });
  }

  return res.status(200).json({
    promotion: data ?? null,
  });
}

