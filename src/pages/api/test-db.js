import { supabase } from "@/lib/supabase";

/**
 * GET /api/test-db
 * ทดสอบเชื่อม Supabase DB - อ่านข้อมูลจากตาราง profiles (สูงสุด 5 แถว)
 *
 * ตัวอย่างยิงด้วย axios (ฝั่ง client):
 *   import axios from "axios";
 *   const { data } = await axios.get("/api/test-db");
 *   console.log(data); // { ok: true, data: [...], count: N }
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);

    if (error) {
      return res.status(500).json({ error: error.message, details: error });
    }

    return res.status(200).json({ ok: true, data: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
