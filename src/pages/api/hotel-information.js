import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Public GET: returns hotel info for landing/footer (name, logos, bg, hero text, contact, footer description).
 * ตาราง hotel_information ควรมีคอลัมน์ตาม selectCols ด้านล่าง ถ้าไม่มีให้รัน SQL ใน docs/hotel_information-schema.md
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const selectCols =
      "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location, hotel_main_text, hotel_footter_description";
    const { data: row, error } = await supabaseAdmin
      .from("hotel_information")
      .select(selectCols)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Could not load hotel_information");

    const footerUrl = row?.hotel_logo_footter_url ?? row?.hotel_logo_url ?? null;
    return res.status(200).json({
      data: {
        hotelName: row?.hotel_name ?? null,
        hotelDescription: row?.hotel_description ?? null,
        hotelLogoUrl: row?.hotel_logo_url ?? null,
        hotelLogoFooterUrl: footerUrl,
        hotelBgUrl: row?.hotel_bg_url ?? null,
        hotelPhone: row?.hotel_phone ?? null,
        hotelEmail: row?.hotel_email ?? null,
        hotelLocation: row?.hotel_location ?? null,
        hotelMainText: row?.hotel_main_text ?? null,
        hotelFooterDescription: row?.hotel_footter_description ?? null,
      },
    });
  } catch (err) {
    console.error("[hotel-information] GET error:", err);
    return res.status(200).json({
      data: { hotelName: null, hotelDescription: null, hotelLogoUrl: null, hotelLogoFooterUrl: null, hotelBgUrl: null, hotelPhone: null, hotelEmail: null, hotelLocation: null, hotelMainText: null, hotelFooterDescription: null },
    });
  }
}
