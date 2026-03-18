import { getConversationsController, createConversationController } from "@/features/chat/chatController"
import { withErrorHandler } from "@/utils/withErrorHandler"
import { protect } from "@/middlewares/protect"
import { withMethod } from "@/middlewares/withMethod"

// GET  /api/chatbot/conversations  → ดึง conversations ทั้งหมดของ user
// POST /api/chatbot/conversations  → สร้าง conversation ใหม่
export default withErrorHandler(
  protect(async (req, res) => {
    return withMethod(["GET", "POST"], async (req, res) => {
      if (req.method === "GET") return getConversationsController(req, res)
      return createConversationController(req, res)
    })(req, res)
  })
)
