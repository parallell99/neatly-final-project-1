import { authRepository } from "@/features/auth/authRepository";
import { authSupabaseRepository } from "@/features/auth/authSupabaseRepository";
import { AppError } from "@/utils/AppError";

/**
 * Auth Service
 * จัดการ business flow
 */

/**
 * register new account
 */
async function register(userData) {

  const {
    email,
    password,
    firstName,
    lastName,
    username,
    phoneNumber,
    dateOfBirth,
    country,
    profilePictureUrl,
  } = userData;

  const existingUser = await authRepository.findByUsername(username);
  console.log(existingUser)

  if (existingUser) {
    throw new AppError("Username already in use", 409);
  }

  try {
    const { user, session } = await authSupabaseRepository.signUp(
      email,
      password,
      {
        username,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber,
        date_of_birth: dateOfBirth,
        country: country,  
        profile_image_url: profilePictureUrl,
      }
    );

    return {
      message: "Register successful",
      userId: user.id,
      token: session?.access_token ?? null,
    };

  } catch (error) {

    // map supabase error
    if (error.message?.includes("User already registered")) {
      throw new AppError("Email already in use", 409);
    }

    // unknown error
    throw new AppError("Registration failed", 500);
  }
}

async function login(email, password) {
  try {
    const result = await authSupabaseRepository.signIn(email, password);
    return {
      message: "Register successful",
      token: result.session.access_token,
    };
  } catch (error) {
    // map supabase error
    if (error.message?.includes("Invalid login credentials")) {
      throw new AppError("Invalid email or password", 409);
    }

    // unknown error
    throw new AppError("login failed", 500);
  }

}

async function getUserByToken(token) {
  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await authSupabaseRepository.getUserFromSupabase(token);
  if (!user?.id) {
    throw new AppError("Unauthorized", 401);
  }
  return user;
}

async function logout() {
  return await authSupabaseRepository.signOut();
}

async function getUserById(id) {
  return await authRepository.findById(id);
}

export const authService = {
  register,
  login,
  logout,
  getUserById,
  getUserByToken,
};
