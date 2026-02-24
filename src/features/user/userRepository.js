import connectionPool from "@/utils/db";

async function findById(id) {
  const query = `
    SELECT id, username, first_name, last_name, phone, date_of_birth,
       country, profile_image_url, role, stripe_customer_id,
       created_at, updated_at
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

async function updateProfile(userId, data) {
  const { first_name, last_name, phone, country, date_of_birth } = data;
  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, phone = $3, country = $4, date_of_birth = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING id, first_name, last_name, phone, country, date_of_birth, updated_at
  `;
  const { rows } = await connectionPool.query(query, [
    first_name ?? null,
    last_name ?? null,
    phone ?? null,
    country ?? null,
    date_of_birth ?? null,
    userId,
  ]);
  return rows[0] || null;
}

export const userRepository = { findById, updateProfileImage, updateProfile };

