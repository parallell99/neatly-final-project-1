import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { data, error } = await supabaseAdmin
    .from("extras_requests")
    .select("id, name, price")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch extras_requests failed:", error);
    return res.status(500).json({ message: "Failed to load extras requests" });
  }

  return res.status(200).json({ extras: data ?? [] });
}

