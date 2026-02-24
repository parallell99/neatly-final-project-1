import connectionPool from "@/utils/db"

/** ดึง Q&A จาก suggestion_topics แล้วแปลงเป็น text สำหรับใส่ใน system prompt */
async function buildQABlock() {
  const result = await connectionPool.query(`
    SELECT topic, reply_format, reply_message, reply_title
    FROM suggestion_topics
    WHERE reply_format = 'Message'
    ORDER BY position, suggestion_topics_id
  `)

  if (result.rows.length === 0) return ""

  const lines = result.rows.map((r) => `Q: ${r.topic}\nA: ${r.reply_message ?? r.reply_title ?? ""}`)
  return lines.join("\n\n")
}

/** Query ห้องว่างตามวันที่ */
async function queryAvailableRooms(checkIn, checkOut) {
  const result = await connectionPool.query(
    `
    SELECT
      rp.id,
      rp.title,
      rp.description,
      rp.price_per_night,
      rp.image_main,
      rt.name AS room_type_name
    FROM room_properties rp
    LEFT JOIN room_types rt ON rp.room_type_id = rt.id
    WHERE rp.id NOT IN (
      SELECT room_id FROM orders
      WHERE NOT (check_out_date <= $1 OR check_in_date >= $2)
        AND status != 'cancelled'
    )
    ORDER BY rp.price_per_night ASC
    `,
    [checkIn, checkOut]
  )
  return result.rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price_per_night: r.price_per_night,
    image_main: r.image_main,
    room_type: { name: r.room_type_name },
  }))
}

/** Build system prompt รวม role + schema + Q&A */
function buildSystemPrompt(qaBlock) {
  return `คุณเป็น Neatly Assistant ผู้ช่วยเสมือนของโรงแรม Neatly
ตอบเฉพาะเรื่องที่เกี่ยวกับโรงแรมเท่านั้น ใช้ภาษาเดียวกับที่ลูกค้าถาม (ไทย หรือ อังกฤษ)

กฎสำคัญ:
- ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกจาก JSON
- อย่าแต่งข้อมูลที่ไม่มีใน Q&A ด้านล่าง

รูปแบบ JSON ที่ใช้ได้:

1. ตอบข้อความธรรมดา:
{"type":"message","text":"..."}

2. แสดงห้องพัก (เมื่อลูกค้าต้องการดูห้อง/จอง/ห้องว่าง):
{"type":"room_type","reply_title":"...","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD"}
หมายเหตุ: ถ้าลูกค้าไม่ได้ระบุวันที่ ให้ check_in และ check_out เป็น null

3. แสดงตัวเลือก (เมื่อมีหลายตัวเลือกให้เลือก):
{"type":"option_with_details","reply_title":"...","options":[{"option_text":"...","details":"..."}]}

4. ขอข้อมูลเพิ่มเติม (เมื่อลูกค้าถามห้องว่างแต่ไม่บอกวันที่):
{"type":"need_info","text":"...","missing":["check_in","check_out"]}

5. ไม่มีข้อมูล (เมื่อคำถามนอกขอบเขต):
{"type":"not_found","text":"ขออภัย ไม่มีข้อมูลในส่วนนี้ กรุณาติดต่อเจ้าหน้าที่โดยตรงค่ะ"}

--- ข้อมูลโรงแรม ---
${qaBlock || "ไม่มีข้อมูล Q&A ในระบบ"}
`
}

// ---------- handler ----------

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })

  const { message, history = [] } = req.body
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" })
  }

  try {
    // 1. ดึง Q&A จาก DB
    const qaBlock = await buildQABlock()

    // 2. Build system prompt
    const systemPrompt = buildSystemPrompt(qaBlock)

    // 3. Build messages array (history + ข้อความใหม่)
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // เก็บ history แค่ 10 รอบหลังสุด เพื่อไม่ให้ prompt ยาวเกินไป
      { role: "user", content: message },
    ]

    // 4. เรียก OpenRouter
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-30b-a3b-thinking",
        messages: chatMessages,
        response_format: { type: "json_object" }, // บังคับให้ตอบ JSON
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error("OpenRouter error status:", aiRes.status)
      console.error("OpenRouter error body:", errText)
      return res.status(502).json({ error: "AI service error", status: aiRes.status, detail: errText })
    }

    const aiData = await aiRes.json()
    const rawContent = aiData.choices?.[0]?.message?.content ?? ""

    // 5. Parse JSON จาก AI
    let parsed
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      // fallback ถ้า AI ตอบผิด format
      return res.status(200).json({ type: "message", text: rawContent })
    }

    // 6. ถ้า type = room_type และมีวันที่ → query DB หาห้องว่าง
    console.log("AI parsed response:", JSON.stringify(parsed))
    if (parsed.type === "room_type" && parsed.check_in && parsed.check_out) {
      console.log("Querying rooms:", parsed.check_in, "->", parsed.check_out)
      const rooms = await queryAvailableRooms(parsed.check_in, parsed.check_out)
      return res.status(200).json({
        type: "room_type",
        reply_title: parsed.reply_title ?? "ห้องที่ว่างในช่วงเวลานั้น",
        button_name: "View Details",
        rooms,
      })
    }

    // 7. ส่ง response ตาม type อื่นๆ กลับตรงๆ
    return res.status(200).json(parsed)
  } catch (error) {
    console.error("AI CHATBOT ERROR:", error)
    return res.status(500).json({ type: "message", text: "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" })
  }
}
