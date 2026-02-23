import { userService } from "./userService";

export async function fetchUserController(req, res) {

  const userId = req.user.id;
  const profile = await userService.getUserById(userId);

  return res.status(200).json(profile);
}

export async function updateAvatarController(req, res) {
  const userId = req.user.id;

  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== "string") {
    throw new AppError("avatarUrl is required", 400);
  }

  await userService.updateAvatar(userId, avatarUrl);
  return res.status(200).json({ message: "Avatar updated" });
}

export const userController = {
  fetchUserController,
  updateAvatarController,
};