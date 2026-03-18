import { getMessagesController, saveMessagesController } from "@/features/chat/chatController"
import { withErrorHandler } from "@/utils/withErrorHandler"
import { protect } from "@/middlewares/protect"
import { withMethod } from "@/middlewares/withMethod"

// GET  /api/chatbot/conversations/[id]/messages  → ดึง messages ใน conversation
// POST /api/chatbot/conversations/[id]/messages  → บันทึก user+bot message คู่ใหม่
export default withErrorHandler(
  protect(async (req, res) => {
    return withMethod(["GET", "POST"], async (req, res) => {
      if (req.method === "GET") return getMessagesController(req, res)
      return saveMessagesController(req, res)
    })(req, res)
  })
)
