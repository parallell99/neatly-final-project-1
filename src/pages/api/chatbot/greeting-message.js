import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const message = req.body?.message ?? req.body?.greetingMessage;
  if (message === undefined || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    await connectionPool.query(
      "UPDATE greeting_messages SET message = $1 WHERE type_text = 'greeting_message'",
      [message.trim()]
    );
    return res.status(200).json({ message: "Greeting message updated successfully" });
  } catch (error) {
    console.error("POST GREETING MESSAGE ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
