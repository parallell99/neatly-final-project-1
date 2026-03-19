import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Prevent 304 responses (no body) causing client JSON parse issues
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const { data, error } = await supabaseAdmin
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
