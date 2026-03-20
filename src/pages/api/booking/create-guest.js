import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // ==============================
    // 1️⃣ ดึง token จาก header
    // ==============================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    // ==============================
    // 2️⃣ สร้าง client ด้วย ANON KEY
    // (ใช้ validate JWT เท่านั้น)
    // ==============================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        message:
          "Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // ==============================
    // 3️⃣ ตรวจสอบ user จาก token
    // ==============================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    console.log("USER:", user);

    if (userError || !user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // ==============================
    // 4️⃣ Validate body
    // ==============================
    const { first_name, last_name, email, phone, country } = req.body ?? {};

    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        message:
          "Missing required fields: first_name, last_name, email, phone",
      });
    }

    // ==============================
    // 5️⃣ Insert ด้วย service_role
    // (bypass RLS)
    // ==============================
    const insertPayload = {
      user_id: user.id,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
    };
    if (country != null && String(country).trim() !== "") {
      insertPayload.country = String(country).trim();
    }

    const { data: guest, error } = await supabaseAdmin
      .from("guests")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Create guest failed:", error);
      return res.status(500).json({ message: "Create guest failed" });
    }

    return res.status(200).json({ guest });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}