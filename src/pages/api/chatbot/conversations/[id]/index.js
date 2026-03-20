import { deleteConversationController } from "@/features/chat/chatController"
import { withErrorHandler } from "@/utils/withErrorHandler"
import { protect } from "@/middlewares/protect"
import { withMethod } from "@/middlewares/withMethod"

// DELETE /api/chatbot/conversations/[id]  → ลบ conversation
export default withErrorHandler(
  protect(
    withMethod("DELETE", deleteConversationController)
  )
)
