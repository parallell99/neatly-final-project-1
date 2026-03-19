import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from("standard_requests")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("[booking/standard-requests] error:", error);
      // Avoid breaking UI on transient Supabase/Vercel issues
      return res.status(200).json({ standard: [] });
    }

    return res.status(200).json({ standard: data ?? [] });
  } catch (err) {
    console.error("[booking/standard-requests] unexpected error:", err);
    // Avoid breaking UI on transient Supabase/Vercel issues
    return res.status(200).json({ standard: [] });
  }
}
