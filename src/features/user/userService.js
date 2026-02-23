import { userRepository } from "./userRepository";
import { userSupabaseRepository } from "./userSupabaseRepository";
import { AppError } from "@/utils/AppError";

async function getUserById(userId) {


  const profile = await userRepository.findById(userId);
  if (!profile) {
    throw new AppError("User profile not found", 404);
  }

  return profile;
}

async function updateAvatar(userId, avatarUrl) {
  const updated = await userRepository.updateProfileImage(userId, avatarUrl);
  if (!updated) {
    throw new AppError("Failed to update avatar", 400);
  }
}

export const userService = { getUserById, updateAvatar };