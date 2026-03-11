import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getUserByToken(token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  return user;
}

export const userSupabaseRepository = { getUserByToken };