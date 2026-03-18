import { chatRepository } from "./chatRepository"
import { AppError } from "@/utils/AppError"

/** แปลง message row จาก DB กลับเป็น format ที่ ChatbotResponse ใช้ */
function dbMessageToUiMessage(row) {
  if (row.role === "user") {
    return { role: "user", text: row.content }
  }
  // bot message — ถ้ามี metadata ให้ spread เข้าไป (rooms, options, etc.)
  const metadata = row.metadata ?? {}
  return {
    role: "bot",
    type: row.message_type,
    text: row.content,
    ...metadata,
  }
}

/** ดึง conversations ของ user */
async function getConversations(userId) {
  return chatRepository.findConversationsByUserId(userId)
}

/** ดึง messages ของ conversation (ตรวจสิทธิ์ก่อน) */
async function getMessages(conversationId, userId) {
  const conversation = await chatRepository.findConversationById(conversationId, userId)
  if (!conversation) throw new AppError("Conversation not found", 404)

  const rows = await chatRepository.findMessagesByConversationId(conversationId)
  return rows.map(dbMessageToUiMessage)
}

/** สร้าง conversation ใหม่ */
async function createConversation(userId) {
  return chatRepository.createConversation(userId, "New Conversation")
}

/**
 * บันทึกคู่ message (user + bot) ลง DB
 * ถ้าเป็น message แรก → ตั้ง title เป็นข้อความของ user (ตัดแค่ 60 ตัวอักษร)
 */
async function saveMessages(conversationId, userId, userText, botResponse) {
  const conversation = await chatRepository.findConversationById(conversationId, userId)
  if (!conversation) throw new AppError("Conversation not found", 404)

  // บันทึก user message
  await chatRepository.createMessage(conversationId, {
    role: "user",
    content: userText,
    message_type: "message",
  })

  // แยก text content และ metadata ออกจาก botResponse
  const { role: _role, text, type, ...rest } = botResponse
  const metadata = Object.keys(rest).length > 0 ? rest : null

  // บันทึก bot message
  await chatRepository.createMessage(conversationId, {
    role: "bot",
    content: text ?? "",
    message_type: type ?? "message",
    metadata,
  })

  // touch updated_at ของ conversation
  await chatRepository.touchConversation(conversationId)

  // ถ้ายังเป็น "New Conversation" → ตั้ง title จากข้อความแรกของ user
  if (conversation.title === "New Conversation") {
    const title = userText.slice(0, 60)
    await chatRepository.updateConversationTitle(conversationId, title)
  }
}

/** ลบ conversation */
async function deleteConversation(conversationId, userId) {
  const conversation = await chatRepository.findConversationById(conversationId, userId)
  if (!conversation) throw new AppError("Conversation not found", 404)
  await chatRepository.deleteConversation(conversationId, userId)
}

export const chatService = {
  getConversations,
  getMessages,
  createConversation,
  saveMessages,
  deleteConversation,
}
