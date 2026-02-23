import connectionPool from "@/utils/db";

async function findById(id) {
  const query = `
    SELECT id, username, first_name, last_name, phone, date_of_birth,
           country, profile_image_url, role, created_at, updated_at
    FROM users
    WHERE id = $1
  `;
  const { rows } = await connectionPool.query(query, [id]);
  return rows[0] || null;
}

async function updateProfileImage(userId, profileImageUrl) {
  const query = `
    UPDATE users
    SET profile_image_url = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, profile_image_url
  `;
  const { rows } = await connectionPool.query(query, [profileImageUrl, userId]);
  return rows[0] || null;
}

export const userRepository = { findById, updateProfileImage };

