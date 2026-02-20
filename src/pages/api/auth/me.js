import { supabase } from "@/lib/supabase";
import { authRepository } from "@/repositories/authRepository";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await authRepository.findById(user.id);
    if (!profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
