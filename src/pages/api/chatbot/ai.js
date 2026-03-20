import connectionPool from "@/utils/db"

// ---------- cache Q&A (5 นาที) ----------
let qaCache = null
let qaCacheExpiry = 0
const QA_CACHE_TTL = 5 * 60 * 1000

/** ดึง Q&A จาก suggestion_topics แล้วแปลงเป็น text สำหรับใส่ใน system prompt */
async function buildQABlock() {
  const now = Date.now()
  if (qaCache !== null && now < qaCacheExpiry) return qaCache

  const result = await connectionPool.query(`
    SELECT topic, reply_format, reply_message, reply_title
    FROM suggestion_topics
    WHERE reply_format = 'Message'
    ORDER BY position, suggestion_topics_id
  `)

  qaCache = result.rows.length === 0
    ? ""
    : result.rows.map((r) => `Q: ${r.topic}\nA: ${r.reply_message ?? r.reply_title ?? ""}`).join("\n\n")
  qaCacheExpiry = now + QA_CACHE_TTL
  return qaCache
}

/** Query ห้องว่างตามวันที่ โดยเรียกผ่าน API /api/rooms/availablerooms */
async function queryAvailableRooms(checkIn, checkOut, req) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http"
  const host = req.headers.host
  const url = `${protocol}://${host}/api/rooms/availablerooms?checkIn=${checkIn}&checkOut=${checkOut}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`availablerooms API error: ${response.status}`)
  }
  const json = await response.json()
  const rows = json.data ?? []

  return rows
    .filter((r) => Number(r.available_rooms) > 0)
    .map((r) => ({
      id: r.room_type_id,
      title: r.room_type_name,
      description: r.description,
      price_per_night: r.price_per_night,
      image_main: r.image_main,
      room_type: { name: r.room_type_name },
    }))
}

/** Build system prompt รวม role + schema + Q&A */
function buildSystemPrompt(qaBlock) {
  return `คุณเป็น Neatly Assistant ผู้ช่วยเสมือนของโรงแรม Neatly
ตอบเฉพาะเรื่องที่เกี่ยวกับโรงแรมเท่านั้น ใช้ภาษาเดียวกับที่ลูกค้าถาม (ไทย, อังกฤษ, จีน หรือ ญี่ปุ่น)

กฎสำคัญ:
- ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกจาก JSON
- อย่าแต่งข้อมูลที่ไม่มีใน Q&A ด้านล่าง

รูปแบบ JSON ที่ใช้ได้:

1. ตอบข้อความธรรมดา:
{"type":"message","text":"..."}

2. แสดงห้องพัก (เมื่อลูกค้าต้องการดูห้อง/จอง/ห้องว่าง และระบุวันที่ครบถ้วนทั้งวัน เดือน และปี):
{"type":"room_type","reply_title":"...","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD"}
หมายเหตุ: ใช้ได้เมื่อลูกค้าบอกวันที่ครบทั้ง วัน เดือน และ ปี เท่านั้น ถ้าขาดอย่างใดอย่างหนึ่งให้ขอเพิ่ม

3. แสดงตัวเลือก (เมื่อมีหลายตัวเลือกให้เลือก):
{"type":"option_with_details","reply_title":"...","options":[{"option_text":"...","details":"..."}]}

4. ขอข้อมูลเพิ่มเติม (เมื่อลูกค้าถามห้องว่างแต่ไม่บอกวันที่ครบ เช่น ไม่มีปี หรือไม่มีวันเช็คเอาท์):
{"type":"need_info","text":"...","missing":["check_in","check_out"]}

5. ไม่มีข้อมูล (เมื่อคำถามนอกขอบเขต) หรือ ไม่เข้าใจคำถาม:
{"type":"not_found","text":"ขออภัย ไม่มีข้อมูลในส่วนนี้ กรุณาติดต่อเจ้าหน้าที่โดยตรงค่ะ / We apologize, but this information is currently unavailable. Please contact our staff directly for further assistance."}

--- ข้อมูลโรงแรม ---
${qaBlock || "ไม่มีข้อมูล Q&A ในระบบ"}
`
}

/** พยายาม parse JSON จากข้อความของ AI และซ่อมเคสที่ขาดปีกกาเล็กน้อย */
function safeParseAIJson(rawContent) {
  if (!rawContent) return null

  // ถ้า OpenRouter ส่งมาเป็น object อยู่แล้ว
  if (typeof rawContent === "object") {
    return rawContent
  }

  const text = String(rawContent).trim()

  const tryParse = (input) => {
    try {
      const obj = JSON.parse(input)
      if (obj && typeof obj === "object") return obj
    } catch {
      // ignore
    }
    return null
  }

  // 1) ลอง parse ตรงๆ ก่อน
  let parsed = tryParse(text)
  if (parsed) return parsed

  // 2) ถ้ามี { แต่ไม่มี } หรือจำนวน { มากกว่า } ให้ลองเติม } ให้ครบ
  const openCount = (text.match(/{/g) || []).length
  const closeCount = (text.match(/}/g) || []).length
  if (openCount > closeCount) {
    const fixed = `${text}${"}".repeat(openCount - closeCount)}`
    parsed = tryParse(fixed)
    if (parsed) return parsed
  }

  // 3) ลองตัดเฉพาะ substring ระหว่าง { แรกกับ } สุดท้าย
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const inner = text.slice(firstBrace, lastBrace + 1)
    parsed = tryParse(inner)
    if (parsed) return parsed
  }

  return null
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
        // model: process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-30b-a3b-thinking",
        model : "google/gemini-2.5-flash-lite",
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
    console.log("AI raw content:", rawContent)

    // 5. Parse JSON จาก AI
    let parsed = safeParseAIJson(rawContent)
    if (!parsed) {
      console.warn("Failed to parse AI JSON, fallback to generic message. Raw:", rawContent)
      return res.status(200).json({
        type: "message",
        text: "ขออภัยค่ะ ระบบตอบไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง",
      })
    }

    // บางโมเดลตอบ JSON แบบ nested เช่น {"final":"{...}"} หรือ {"response":"{...}"}
    // ให้ unwrap ออกมา
    const WRAPPER_KEYS = ["final", "response", "result", "output", "answer"]
    for (const key of WRAPPER_KEYS) {
      if (parsed[key] && typeof parsed[key] === "string" && Object.keys(parsed).length === 1) {
        try {
          const inner = JSON.parse(parsed[key])
          if (inner && typeof inner === "object") {
            parsed = inner
          }
        } catch {
          // ถ้า parse ไม่ได้ก็ใช้ค่าเดิม
        }
        break
      }
    }

    // Validate type — ถ้า type ไม่ถูกต้องให้ fallback เป็น message
    const VALID_TYPES = ["message", "room_type", "option_with_details", "need_info", "not_found"]
    if (!parsed.type || !VALID_TYPES.includes(parsed.type)) {
      const fallbackText = parsed.text ?? parsed.message ?? parsed.answer ?? parsed.content ?? "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      parsed = { type: "message", text: fallbackText }
    }

    // 6. ถ้า type = room_type และมีวันที่ → ตรวจสอบแล้ว query DB หาห้องว่าง
    console.log("AI parsed response:", JSON.stringify(parsed))
    if (parsed.type === "room_type" && parsed.check_in && parsed.check_out) {
      console.log("Querying rooms:", parsed.check_in, "->", parsed.check_out)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentYear = today.getFullYear()

      const checkInDate = new Date(parsed.check_in)
      const checkOutDate = new Date(parsed.check_out)

      // เช็คว่า parse วันที่สำเร็จไหม
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(200).json({
          type: "need_info",
          text: "กรุณาระบุวันที่ให้ครบถ้วน รวมถึงปี ค.ศ. ด้วยนะคะ",
          missing: ["check_in", "check_out"],
        })
      }

      // เช็คว่าปีที่ระบุมาสมเหตุสมผลไหม (ต้องไม่เกิน 2 ปีข้างหน้า)
      const checkInYear = checkInDate.getFullYear()
      if (checkInYear < currentYear || checkInYear > currentYear + 2) {
        return res.status(200).json({
          type: "need_info",
          text: `กรุณาระบุปี ค.ศ. ให้ชัดเจนด้วยนะคะ (เช่น ${currentYear} หรือ ${currentYear + 1})`,
          missing: ["check_in", "check_out"],
        })
      }

      // เช็คว่าวันที่อยู่ในอดีตไหม
      if (checkInDate < today) {
        return res.status(200).json({
          type: "message",
          text: "ไม่สามารถจองห้องในอดีตได้ค่ะ กรุณาระบุวันที่ในอนาคต",
        })
      }

      const rooms = await queryAvailableRooms(parsed.check_in, parsed.check_out, req)
      if (rooms.length === 0) {
        return res.status(200).json({
          type: "message",
          text: `ขออภัยค่ะ ไม่มีห้องว่างในช่วงวันที่ ${parsed.check_in} ถึง ${parsed.check_out} กรุณาเลือกวันอื่นหรือติดต่อเจ้าหน้าที่ค่ะ`,
        })
      }
      const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
      }
      return res.status(200).json({
        type: "room_type",
        reply_title: `ห้องพักระหว่างวันที่ ${formatDate(parsed.check_in)} - ${formatDate(parsed.check_out)} มีดังนี้`,
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
