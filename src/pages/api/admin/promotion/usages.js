import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  // Prefer service role when available, fallback to anon for read-only GET
  return createClient(url, serviceKey || anonKey || "");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Prevent 304 responses (no body) causing client JSON parse issues
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(200).json({ data: {} });

    const { data, error } = await supabase
      .from("promotion_usages")
      .select("promotion_id");

    if (error) {
      console.error("[admin/promotion/usages] error:", error);
      // Avoid breaking admin UI on transient Supabase/Vercel issues
      return res.status(200).json({ data: {} });
    }

    const countByPromo = {};
    (data ?? []).forEach((row) => {
      const pid = row?.promotion_id;
      if (pid) {
        countByPromo[pid] = (countByPromo[pid] || 0) + 1;
      }
    });

    return res.status(200).json({ data: countByPromo });
  } catch (err) {
    console.error("[admin/promotion/usages] unexpected error:", err);
    // Avoid breaking admin UI on transient Supabase/Vercel issues
    return res.status(200).json({ data: {} });
  }
}
