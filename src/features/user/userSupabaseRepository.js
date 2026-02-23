import { supabase } from "@/lib/supabase";

async function getUserByToken(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return user;
}

export const userSupabaseRepository = { getUserByToken };