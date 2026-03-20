import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  if (req.method === "POST") {
    return handlePost(req, res);
  }
  if (req.method === "DELETE") {
    return handleDel(req, res);
  }
  return res.status(405).json({ error: "Method Not Allowed" });
}

async function handleGet(req, res) {
  try {
    const topicsResult = await connectionPool.query(
      "SELECT * FROM suggestion_topics ORDER BY position, suggestion_topics_id"
    );

    const topics = await Promise.all(
      topicsResult.rows.map(async (topic) => {
        if (topic.reply_format === "Room type") {
          const roomTypesResult = await connectionPool.query(
            `SELECT room_type_chatbot.room_type_name AS room_type_name
            FROM suggestion_topic_room_types
            JOIN room_type_chatbot ON suggestion_topic_room_types.room_type_id = room_type_chatbot.id
            WHERE suggestion_topic_room_types.suggestion_topics_id = $1`,
            [topic.suggestion_topics_id]
          );
          return { ...topic, roomTypes: roomTypesResult.rows.map((r) => r.room_type_name) };
        }

        if (topic.reply_format === "Option with details") {
          const optionsResult = await connectionPool.query(
            "SELECT option_text, details FROM suggestion_topic_options WHERE suggestion_topics_id = $1",
            [topic.suggestion_topics_id]
          );
          return { ...topic, options: optionsResult.rows };
        }
        return topic;
      })
    );

    const greetingResult = await connectionPool.query(
      "SELECT * FROM greeting_messages ORDER BY greeting_messages_id"
    );

    return res.status(200).json({ data: { topics, greetingMessages: greetingResult.rows } });
  } catch (error) {
    console.error("GET SUGGESTIONS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handlePost(req, res) {
  const { greetingMessage, autoReply, topics } = req.body;

  if (!topics || !Array.isArray(topics)) {
    return res.status(400).json({ error: "topics must be an array" });
  }

  const client = await connectionPool.connect();
  try {
    await client.query("BEGIN");

    // update greeting messages
    if (greetingMessage !== undefined) {
      await client.query(
        "UPDATE greeting_messages SET message = $1 WHERE type_text = 'greeting_message'",
        [greetingMessage]
      );
    }
    if (autoReply !== undefined) {
      await client.query(
        "UPDATE greeting_messages SET message = $1 WHERE type_text = 'auto_reply_message'",
        [autoReply]
      );
    }

    // replace all suggestion topics and reset ID sequence
    await client.query("TRUNCATE suggestion_topics RESTART IDENTITY CASCADE");

    for (const [index, topic] of topics.entries()) {
      const { rows } = await client.query(
        `INSERT INTO suggestion_topics (topic, reply_format, reply_title, reply_message, button_name, position)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING suggestion_topics_id`,
        [
          topic.topic,
          topic.replyFormat,
          topic.replyTitle ?? null,
          topic.replyMessage ?? null,
          topic.buttonName ?? null,
          index,
        ]
      );
      const newId = rows[0].suggestion_topics_id;

      if (topic.replyFormat === "Room type" && Array.isArray(topic.roomTypes)) {
        for (const roomName of topic.roomTypes) {
          const roomResult = await client.query(
            "SELECT id AS room_type_id FROM room_type_chatbot WHERE room_type_name = $1",
            [roomName]
          );
          if (roomResult.rows.length > 0) {
            await client.query(
              "INSERT INTO suggestion_topic_room_types (suggestion_topics_id, room_type_id) VALUES ($1, $2)",
              [newId, roomResult.rows[0].room_type_id]
            );
          }
        }
      }

      if (topic.replyFormat === "Option with details" && Array.isArray(topic.options)) {
        for (const opt of topic.options) {
          await client.query(
            "INSERT INTO suggestion_topic_options (suggestion_topics_id, option_text, details) VALUES ($1, $2, $3)",
            [newId, opt.option, opt.details ?? null]
          );
        }
      }
    }

    await client.query("COMMIT");
    return res.status(200).json({ message: "Saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST SUGGESTIONS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}

async function handleDel(req, res) {
  const id = req.query?.id ?? req.body?.id;
  const topicId = typeof id === "string" ? parseInt(id, 10) : id;
  if (Number.isNaN(topicId) || topicId < 1) {
    return res.status(400).json({ error: "Valid id (suggestion_topics_id) is required" });
  }

  const client = await connectionPool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM suggestion_topic_room_types WHERE suggestion_topics_id = $1",
      [topicId]
    );
    await client.query(
      "DELETE FROM suggestion_topic_options WHERE suggestion_topics_id = $1",
      [topicId]
    );
    const result = await client.query(
      "DELETE FROM suggestion_topics WHERE suggestion_topics_id = $1 RETURNING suggestion_topics_id",
      [topicId]
    );

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Suggestion topic not found" });
    }
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE SUGGESTIONS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}