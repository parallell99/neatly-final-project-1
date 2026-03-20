import connectionPool from "@/utils/db"

/** ดึง conversations ทั้งหมดของ user เรียงจากใหม่ไปเก่า */
async function findConversationsByUserId(userId) {
  const { rows } = await connectionPool.query(
    `SELECT id, title, created_at, updated_at
     FROM chat_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  )
  return rows
}

/** ดึง conversation เดียวตาม id (ตรวจสอบว่าเป็นของ user ด้วย) */
async function findConversationById(id, userId) {
  const { rows } = await connectionPool.query(
    `SELECT id, title, created_at, updated_at
     FROM chat_conversations
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
  return rows[0] || null
}

/** สร้าง conversation ใหม่ */
async function createConversation(userId, title = "New Conversation") {
  const { rows } = await connectionPool.query(
    `INSERT INTO chat_conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at, updated_at`,
    [userId, title]
  )
  return rows[0]
}

/** อัปเดต title และ updated_at ของ conversation */
async function updateConversationTitle(id, title) {
  await connectionPool.query(
    `UPDATE chat_conversations
     SET title = $1, updated_at = NOW()
     WHERE id = $2`,
    [title, id]
  )
}

/** touch updated_at เมื่อมี message ใหม่ */
async function touchConversation(id) {
  await connectionPool.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`,
    [id]
  )
}

/** ดึง messages ทั้งหมดใน conversation เรียงจากเก่าไปใหม่ */
async function findMessagesByConversationId(conversationId) {
  const { rows } = await connectionPool.query(
    `SELECT id, role, content, message_type, metadata, created_at
     FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  )
  return rows
}

/** บันทึก message ใหม่ */
async function createMessage(conversationId, { role, content, message_type = "message", metadata = null }) {
  const { rows } = await connectionPool.query(
    `INSERT INTO chat_messages (conversation_id, role, content, message_type, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, role, content, message_type, metadata, created_at`,
    [conversationId, role, content, message_type, metadata ? JSON.stringify(metadata) : null]
  )
  return rows[0]
}

/** ลบ conversation (cascade ลบ messages ด้วย) */
async function deleteConversation(id, userId) {
  await connectionPool.query(
    `DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
}

export const chatRepository = {
  findConversationsByUserId,
  findConversationById,
  createConversation,
  updateConversationTitle,
  touchConversation,
  findMessagesByConversationId,
  createMessage,
  deleteConversation,
}
