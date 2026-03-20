// providers/authProvider.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";



async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) {
    throw error;
  }

  return { user: data.user, session: data.session };
}

async function signIn(email, password) {
  const { data, error } =
    await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function signOut() {
  const { error } = await supabaseAdmin.auth.signOut();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
}

async function getUserFromSupabase(token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  return user;

}

// async function deleteUser(userId) {
//   // ⚠ ต้องใช้ service role key เท่านั้น
//   const { error } =
//     await supabase.auth.admin.deleteUser(userId);

//   if (error) {
//     const err = new Error("Failed to delete auth user");
//     err.status = 500;
//     throw err;
//   }
// }

export const authSupabaseRepository = {
  signUp,
  signIn,
  signOut,
  getUserFromSupabase
};
