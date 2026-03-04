import { supabaseAdmin } from "@/lib/supabaseAdmin";

function generateUuid() {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  try {
    const { randomUUID } = require("crypto");
    return randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * GET: ดึงข้อมูล Hotel Information (แถวแรก), ส่ง rowExists บอกว่ามีแถวในตารางหรือไม่
 * POST: สร้างแถวใหม่ (ใช้เมื่อยังไม่มีข้อมูลในตาราง)
 * PUT: อัปเดตแถวที่มีอยู่ (ใช้เมื่อมีข้อมูลแล้ว)
 * ตาราง Supabase: hotel_information
 *   - uuid (uuid, primary key)
 *   - hotel_name (varchar/text)
 *   - hotel_description (text)
 *   - hotel_logo_url (text, nullable)
 *   - hotel_logo_footter_url (text, nullable) — logo สำหรับ footer
 *   - hotel_bg_url (text, nullable) — รูปพื้นหลัง about/landing
 *   - hotel_phone (text, nullable), hotel_email (text, nullable), hotel_location (text, nullable) — contact
 *   - hotel_main_text (text, nullable) — ข้อความบนรูป Hero
 *   - created_at, update_at (timestampz) — โปรเจกต์ใช้ชื่อคอลัมน์ update_at
 *
 * ถ้าอัปเดต phone/email/location ไม่ได้: ตารางอาจยังไม่มีคอลัมน์ ให้รัน SQL นี้ใน Supabase → SQL Editor:
 *   ALTER TABLE hotel_information
 *     ADD COLUMN IF NOT EXISTS hotel_phone text,
 *     ADD COLUMN IF NOT EXISTS hotel_email text,
 *     ADD COLUMN IF NOT EXISTS hotel_location text,
 *     ADD COLUMN IF NOT EXISTS hotel_main_text text,
 *     ADD COLUMN IF NOT EXISTS hotel_footter_description text;
 */
const MISSING_COLUMNS_SQL = `ALTER TABLE hotel_information
  ADD COLUMN IF NOT EXISTS hotel_phone text,
  ADD COLUMN IF NOT EXISTS hotel_email text,
  ADD COLUMN IF NOT EXISTS hotel_location text,
  ADD COLUMN IF NOT EXISTS hotel_main_text text,
  ADD COLUMN IF NOT EXISTS hotel_footter_description text;`;

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const defaults = {
    hotelName: "Neatly Hotel",
    hotelDescription:
      "Set in Bangkok, Thailand. Neatly Hotel offers 5-star accommodation with an outdoor pool, kids' club, sports facilities and a fitness centre. There is also a spa, an indoor pool and saunas.\n\nAll units at the hotel are equipped with a seating area, a flat-screen TV with satellite channels, a dining area and a private bathroom with free toiletries, a bathtub and a hairdryer. Every room in Neatly Hotel features a furnished balcony. Some rooms are equipped with a coffee machine.\n\nFree WIFI and entertainment facilities are available at property and also rentals are provided to explore the area.",
    hotelLogoUrl: null,
    hotelLogoFooterUrl: null,
    hotelBgUrl: null,
    hotelPhone: null,
    hotelEmail: null,
    hotelLocation: null,
    hotelMainText: null,
    hotelFooterDescription: null,
  };

  try {
    if (req.method === "GET") {
      try {
        const selects = [
          "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location, hotel_main_text, hotel_footter_description",
          "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location, hotel_footter_description",
          "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location",
          "hotel_name, hotel_description, hotel_logo_url, hotel_phone, hotel_email, hotel_location",
          "hotel_name, hotel_description, hotel_logo_url",
        ];
        let row = null;
        let loaded = false;
        for (const sel of selects) {
          const res = await supabaseAdmin.from("hotel_information").select(sel).limit(1).maybeSingle();
          if (!res.error) {
            row = res.data;
            loaded = true;
            break;
          }
        }
        if (!loaded) throw new Error("Could not load hotel_information");

        const rowExists = !!row;
        const footerUrl = row?.hotel_logo_footter_url ?? row?.hotel_logo_footer ?? null;
        return res.status(200).json({
          data: {
            hotelName: row?.hotel_name ?? defaults.hotelName,
            hotelDescription: row?.hotel_description ?? defaults.hotelDescription,
            hotelLogoUrl: row?.hotel_logo_url ?? null,
            hotelLogoFooterUrl: footerUrl,
            hotelBgUrl: row?.hotel_bg_url ?? null,
            hotelPhone: row?.hotel_phone ?? defaults.hotelPhone ?? "",
            hotelEmail: row?.hotel_email ?? defaults.hotelEmail ?? "",
            hotelLocation: row?.hotel_location ?? defaults.hotelLocation ?? "",
            hotelMainText: row?.hotel_main_text ?? defaults.hotelMainText ?? "",
            hotelFooterDescription: row?.hotel_footter_description ?? defaults.hotelFooterDescription ?? "",
          },
          rowExists,
        });
      } catch (getErr) {
        console.error("[admin/hotel-information] GET error:", getErr);
        return res.status(200).json({ data: defaults, rowExists: false });
      }
    }

    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const buildPayload = (b) => {
      const { hotelName, hotelDescription, hotelLogoUrl, hotelLogoFooterUrl, hotelBgUrl, hotelPhone, hotelEmail, hotelLocation, hotelMainText, hotelFooterDescription } = b || {};
      const payload = {
        hotel_name: hotelName != null ? String(hotelName) : undefined,
        hotel_description: hotelDescription != null ? String(hotelDescription) : undefined,
        hotel_logo_url: hotelLogoUrl !== undefined ? (hotelLogoUrl || null) : undefined,
        hotel_logo_footter_url: hotelLogoFooterUrl !== undefined ? (hotelLogoFooterUrl || null) : undefined,
        hotel_bg_url: hotelBgUrl !== undefined ? (hotelBgUrl || null) : undefined,
        hotel_phone: hotelPhone !== undefined ? (hotelPhone || null) : undefined,
        hotel_email: hotelEmail !== undefined ? (hotelEmail || null) : undefined,
        hotel_location: hotelLocation !== undefined ? (hotelLocation || null) : undefined,
        hotel_main_text: hotelMainText !== undefined ? (hotelMainText || null) : undefined,
        hotel_footter_description: hotelFooterDescription !== undefined ? (hotelFooterDescription || null) : undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      return payload;
    };

    const selectCols = "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location, hotel_main_text, hotel_footter_description";
    const selectColsNoContact = "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url";

    if (req.method === "POST") {
      const payload = buildPayload(body);
      if (!payload.hotel_name && !payload.hotel_description && payload.hotel_logo_url === undefined && payload.hotel_logo_footter_url === undefined) {
        return res.status(400).json({ error: "No fields to create. Send hotelName, hotelDescription (optional: hotelLogoUrl, hotelLogoFooterUrl)." });
      }

      const { data: existingRow } = await supabaseAdmin
        .from("hotel_information")
        .select("uuid")
        .limit(1)
        .maybeSingle();
      if (existingRow?.uuid) {
        return res.status(409).json({ error: "Row already exists. Refresh the page and use Update (PUT)." });
      }

      const now = new Date().toISOString();
      const baseFields = {
        hotel_name: payload.hotel_name ?? defaults.hotelName,
        hotel_description: payload.hotel_description ?? defaults.hotelDescription,
        hotel_logo_url: payload.hotel_logo_url ?? null,
        hotel_logo_footter_url: payload.hotel_logo_footter_url ?? null,
        hotel_bg_url: payload.hotel_bg_url ?? null,
        hotel_phone: payload.hotel_phone ?? null,
        hotel_email: payload.hotel_email ?? null,
        hotel_location: payload.hotel_location ?? null,
        hotel_main_text: payload.hotel_main_text ?? null,
        hotel_footter_description: payload.hotel_footter_description ?? null,
      };
      const baseFieldsNoContact = {
        hotel_name: baseFields.hotel_name,
        hotel_description: baseFields.hotel_description,
        hotel_logo_url: baseFields.hotel_logo_url,
        hotel_logo_footter_url: baseFields.hotel_logo_footter_url,
        hotel_bg_url: baseFields.hotel_bg_url,
      };
      const baseFieldsNoFooter = {
        hotel_name: baseFields.hotel_name,
        hotel_description: baseFields.hotel_description,
        hotel_logo_url: baseFields.hotel_logo_url,
      };
      const selectColsNoFooter = "hotel_name, hotel_description, hotel_logo_url";

      const runInsert = (row, cols) =>
        supabaseAdmin.from("hotel_information").insert(row).select(cols || selectCols).single();

      let result = await runInsert({ ...baseFields, created_at: now, update_at: now });
      if (result.error && ((result.error.message || "").toLowerCase().includes("column") || result.error.code === "PGRST204")) {
        result = await runInsert(baseFields);
      }
      if (result.error && ((result.error.message || "").includes("hotel_phone") || (result.error.message || "").includes("hotel_email") || (result.error.message || "").includes("hotel_location") || (result.error.message || "").includes("hotel_main_text") || result.error.code === "PGRST204")) {
        result = await runInsert({ ...baseFieldsNoContact, created_at: now, update_at: now }, selectColsNoContact);
      }
      if (result.error && ((result.error.message || "").toLowerCase().includes("column") || (result.error.message || "").includes("hotel_logo_footter_url") || (result.error.message || "").includes("hotel_logo_footer") || (result.error.message || "").includes("hotel_bg_url") || result.error.code === "PGRST204")) {
        result = await runInsert({ ...baseFieldsNoFooter, created_at: now, update_at: now }, selectColsNoFooter);
      }
      if (result.error && ((result.error.message || "").toLowerCase().includes("uuid") && (result.error.message || "").toLowerCase().includes("null"))) {
        result = await runInsert({ uuid: generateUuid(), ...baseFields, created_at: now, update_at: now });
      }
      if (result.error && ((result.error.message || "").toLowerCase().includes("column") || (result.error.message || "").includes("hotel_logo_footter_url") || (result.error.message || "").includes("hotel_logo_footer") || (result.error.message || "").includes("hotel_phone") || (result.error.message || "").includes("hotel_email") || (result.error.message || "").includes("hotel_location") || result.error.code === "PGRST204")) {
        result = await runInsert({ uuid: generateUuid(), ...baseFieldsNoContact }, selectColsNoContact);
      }
      if (result.error && ((result.error.message || "").includes("hotel_logo_footter_url") || (result.error.message || "").includes("hotel_logo_footer") || (result.error.message || "").includes("hotel_bg_url"))) {
        result = await runInsert({ uuid: generateUuid(), ...baseFieldsNoFooter }, selectColsNoFooter);
      }

      const { data, error } = result;
      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({ error: "Row already exists. Refresh the page and use Update." });
        }
        console.error("[admin/hotel-information] POST error:", error);
        const msg = [error.message, error.code, error.details].filter(Boolean).join(" | ");
        return res.status(500).json({ error: msg || "Failed to create hotel information" });
      }

      return res.status(201).json({
        data: {
          hotelName: data?.hotel_name,
          hotelDescription: data?.hotel_description,
          hotelLogoUrl: data?.hotel_logo_url ?? null,
          hotelLogoFooterUrl: data?.hotel_logo_footter_url ?? data?.hotel_logo_footer ?? null,
          hotelBgUrl: data?.hotel_bg_url ?? null,
          hotelPhone: data?.hotel_phone ?? null,
          hotelEmail: data?.hotel_email ?? null,
          hotelLocation: data?.hotel_location ?? null,
          hotelMainText: data?.hotel_main_text ?? null,
          hotelFooterDescription: data?.hotel_footter_description ?? null,
        },
      });
    }

    if (req.method === "PUT") {
      const payload = buildPayload(body);
      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: existing, error: findError } = await supabaseAdmin
        .from("hotel_information")
        .select("uuid")
        .limit(1)
        .maybeSingle();

      if (findError || !existing?.uuid) {
        return res.status(404).json({ error: "No row found, use POST to create" });
      }

      const updateAt = new Date().toISOString();
      const updatePayload = { ...payload, update_at: updateAt };
      let result = await supabaseAdmin
        .from("hotel_information")
        .update(updatePayload)
        .eq("uuid", existing.uuid)
        .select(selectCols)
        .maybeSingle();

      const errMsg = result.error?.message || "";
      const missingColumn =
        result.error &&
        (errMsg.includes("hotel_main_text") ||
          errMsg.includes("hotel_phone") ||
          errMsg.includes("hotel_email") ||
          errMsg.includes("hotel_location") ||
          errMsg.includes("hotel_footter_description"));
      if (missingColumn) {
        return res.status(400).json({
          error:
            "ตาราง hotel_information ยังไม่มีคอลัมน์สำหรับฟิลด์นี้ กรุณารัน SQL ด้านล่างใน Supabase → SQL Editor แล้วกดอัปเดตอีกครั้ง",
          missingColumnsSql: MISSING_COLUMNS_SQL,
        });
      }
      if (result.error) {
        const pNoHero = {
          hotel_name: payload.hotel_name,
          hotel_description: payload.hotel_description,
          hotel_logo_url: payload.hotel_logo_url,
          hotel_logo_footter_url: payload.hotel_logo_footter_url,
          hotel_bg_url: payload.hotel_bg_url,
          hotel_phone: payload.hotel_phone,
          hotel_email: payload.hotel_email,
          hotel_location: payload.hotel_location,
          hotel_main_text: payload.hotel_main_text,
          hotel_footter_description: payload.hotel_footter_description,
          update_at: updateAt,
        };
        Object.keys(pNoHero).forEach((k) => pNoHero[k] === undefined && delete pNoHero[k]);
        result = await supabaseAdmin
          .from("hotel_information")
          .update(pNoHero)
          .eq("uuid", existing.uuid)
          .select(selectCols)
          .maybeSingle();
      }
      if (result.error) {
        const pNoContact = {
          hotel_name: payload.hotel_name,
          hotel_description: payload.hotel_description,
          hotel_logo_url: payload.hotel_logo_url,
          hotel_logo_footter_url: payload.hotel_logo_footter_url,
          hotel_bg_url: payload.hotel_bg_url,
          hotel_main_text: payload.hotel_main_text,
          update_at: updateAt,
        };
        Object.keys(pNoContact).forEach((k) => pNoContact[k] === undefined && delete pNoContact[k]);
        result = await supabaseAdmin
          .from("hotel_information")
          .update(pNoContact)
          .eq("uuid", existing.uuid)
          .select(selectCols)
          .maybeSingle();
      }
      if (result.error) {
        const pMin = {
          hotel_name: payload.hotel_name,
          hotel_description: payload.hotel_description,
          hotel_logo_url: payload.hotel_logo_url,
          hotel_main_text: payload.hotel_main_text,
          update_at: updateAt,
        };
        Object.keys(pMin).forEach((k) => pMin[k] === undefined && delete pMin[k]);
        result = await supabaseAdmin
          .from("hotel_information")
          .update(pMin)
          .eq("uuid", existing.uuid)
          .select("hotel_name, hotel_description, hotel_logo_url, hotel_main_text")
          .maybeSingle();
      }

      const { data, error } = result;
      if (error) {
        console.error("[admin/hotel-information] PUT error:", error);
        return res.status(500).json({ error: error.message || "Failed to update hotel information" });
      }

      if (data == null) {
        return res.status(404).json({ error: "No row found, use POST to create" });
      }

      return res.status(200).json({
        data: {
          hotelName: data?.hotel_name,
          hotelDescription: data?.hotel_description,
          hotelLogoUrl: data?.hotel_logo_url ?? null,
          hotelLogoFooterUrl: data?.hotel_logo_footter_url ?? data?.hotel_logo_footer ?? null,
          hotelBgUrl: data?.hotel_bg_url ?? null,
          hotelPhone: data?.hotel_phone ?? null,
          hotelEmail: data?.hotel_email ?? null,
          hotelLocation: data?.hotel_location ?? null,
          hotelMainText: data?.hotel_main_text ?? null,
          hotelFooterDescription: data?.hotel_footter_description ?? null,
        },
      });
    }
  } catch (err) {
    console.error("[admin/hotel-information] ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
