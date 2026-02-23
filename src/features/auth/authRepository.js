import connectionPool from "@/utils/db";

/**
     * ค้นหา user โดย username
     */
async function findByUsername(username) {
    const query = `
        SELECT id, username, role
        FROM users
        WHERE username = $1
    `;
    const { rows } = await connectionPool.query(query, [username]);
    return rows[0] || null;
}


/**
     * สร้าง user ใหม่
     */
async function createUser(userData) {
    const {
        id,
        first_name,
        last_name,
        username,
        phone,
        date_of_birth,
        country,
        profile_image_url,
        role = "user",
    } = userData;

    const query = `
        INSERT INTO users (
            id, first_name, last_name, username, phone, 
            date_of_birth, country, profile_image_url, role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;

    const values = [
        id,
        first_name || null,
        last_name || null,
        username || null,
        phone || null,
        date_of_birth || null,
        country || null,
        profile_image_url || null,
        role,
    ];

    const { rows } = await connectionPool.query(query, values);
    return rows[0];
}

export const authRepository = {
    findByUsername,
    createUser
  };