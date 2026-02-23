import connectionPool from "@/utils/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { positions } = req.body;
  if (!Array.isArray(positions)) {
    return res.status(400).json({ error: "positions must be an array" });
  }

  const client = await connectionPool.connect();
  try {
    await client.query("BEGIN");
    for (const { id, position } of positions) {
      await client.query(
        "UPDATE suggestion_topics SET position = $1 WHERE suggestion_topics_id = $2",
        [position, id]
      );
    }
    await client.query("COMMIT");
    return res.status(200).json({ message: "Reordered successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("REORDER ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
