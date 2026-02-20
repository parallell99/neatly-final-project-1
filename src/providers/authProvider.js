// providers/authProvider.js
import { supabase } from "@/lib/supabase";

/**
 * Auth Provider
 * จัดการการเชื่อมต่อกับ Supabase Auth โดยตรง
 */

async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // user_metadata
    },
  });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  if (!data?.user?.id) {
    const err = new Error("Cannot create auth user");
    err.status = 500;
    throw err;
  }

  return {
    userId: data.user.id,
  };
}

async function signIn(email, password) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    const err = new Error(error.message);
    err.status = 401;
    throw err;
  }

  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
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

export const authProvider = {
  signUp,
  signIn,
  signOut
};
