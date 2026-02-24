import { supabase } from "@/lib/supabase";
import { protect } from "@/middlewares/protect";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  const email = req.user?.email;
  if (!email) {
    return res.status(400).json({ error: "User email not found" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: "Invalid password" });
  }

  return res.status(200).json({ success: true });
}

export default protect(handler);