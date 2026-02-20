import {authRepository} from "@/repositories/authRepository";
import { authProvider } from "@/providers/authProvider";

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
    province,
    profilePictureUrl,
  } = userData;

  // 1.ตรวจสอบ username ซ้ำ
  const existingUser =
    await authRepository.findByUsername(username);

  if (existingUser) {
    const err = new Error("Username already in use");
    err.status = 400;
    throw err;
  }

  // 2️.สร้าง Auth User
  const { userId } =
    await authProvider.signUp(email, password, {
      username,
      first_name: firstName,
      last_name: lastName,
    });

  // 3️.บันทึกข้อมูล profile ลง DB
  
    const newUser =
      await authRepository.createUser({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        username,
        phone: phoneNumber,
        date_of_birth: dateOfBirth,
        country: province,
        profile_image_url: profilePictureUrl,
        role: "user",
      });

    return newUser;

}

async function login(email, password) {
  const result = await authProvider.signIn(email, password);
  return result.session.access_token
}

async function logout() {
  return await authProvider.signOut();
}

async function getUserById(id) {
  return await authRepository.findById(id);
}

export const authService = {
  register,
  login,
  logout,
  getUserById,
};
