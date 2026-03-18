import { chatService } from "./chatService"

/** GET /api/chatbot/conversations */
export async function getConversationsController(req, res) {
  const conversations = await chatService.getConversations(req.user.id)
  return res.status(200).json({ data: conversations })
}

/** POST /api/chatbot/conversations */
export async function createConversationController(req, res) {
  const conversation = await chatService.createConversation(req.user.id)
  return res.status(201).json({ data: conversation })
}

/** GET /api/chatbot/conversations/[id]/messages */
export async function getMessagesController(req, res) {
  const { id } = req.query
  const messages = await chatService.getMessages(id, req.user.id)
  return res.status(200).json({ data: messages })
}

/** POST /api/chatbot/conversations/[id]/messages */
export async function saveMessagesController(req, res) {
  const { id } = req.query
  const { userText, botResponse } = req.body
  await chatService.saveMessages(id, req.user.id, userText, botResponse)
  return res.status(201).json({ success: true })
}

/** DELETE /api/chatbot/conversations/[id] */
export async function deleteConversationController(req, res) {
  const { id } = req.query
  await chatService.deleteConversation(id, req.user.id)
  return res.status(200).json({ success: true })
}
