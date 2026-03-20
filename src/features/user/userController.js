import { userService } from "./userService";
import { AppError } from "@/utils/AppError";

export async function fetchUserController(req, res) {
  const userId = req.user.id;
  const profile = await userService.getUserById(userId);

  return res.status(200).json({
    ...profile,
    email: req.user.email ?? profile.email ?? "",
  });
}

export async function updateAvatarController(req, res) {
  const userId = req.user.id;
  const { avatarUrl } = req.body;
  if (typeof avatarUrl !== "string") {
    throw new AppError("avatarUrl must be a string", 400);
  }
  await userService.updateAvatar(userId, avatarUrl);
  return res.status(200).json({ message: "Avatar updated" });
}

export async function updateProfileController(req, res) {
  const userId = req.user.id;
  const body = req.body || {};
  const first_name = body.firstName ?? body.first_name ?? null;
  const last_name = body.lastName ?? body.last_name ?? null;
  const phone = body.phone ?? null;
  const country = body.country ?? null;
  const date_of_birth = body.dateOfBirth ?? body.date_of_birth ?? null;
  await userService.updateProfile(userId, {
    first_name,
    last_name,
    phone,
    country,
    date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
  });
  return res.status(200).json({ message: "Profile updated" });
}

export const userController = {
  fetchUserController,
  updateAvatarController,
  updateProfileController,
};