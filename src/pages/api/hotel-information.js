import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Public GET: returns hotel name and logo URLs for footer/public use.
 * ตาราง hotel_information: uuid (PK), hotel_logo_footter_url สำหรับ logo footer
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let row = null;
    let err = null;
    const selectWithContact = "hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url, hotel_phone, hotel_email, hotel_location";
    let r = await supabaseAdmin.from("hotel_information").select(selectWithContact).limit(1).maybeSingle();
    err = r.error;
    row = r.data;
    if (err && ((r.error?.message || "").includes("hotel_logo_footter_url") || (r.error?.message || "").includes("hotel_bg_url") || (r.error?.message || "").includes("hotel_phone") || (r.error?.message || "").includes("hotel_email") || (r.error?.message || "").includes("hotel_location"))) {
      r = await supabaseAdmin.from("hotel_information").select("hotel_name, hotel_description, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url").limit(1).maybeSingle();
      err = r.error;
      row = r.data;
    }
    if (err && ((r.error?.message || "").includes("hotel_logo_footter_url") || (r.error?.message || "").includes("hotel_bg_url"))) {
      r = await supabaseAdmin.from("hotel_information").select("hotel_name, hotel_description, hotel_logo_url").limit(1).maybeSingle();
      err = r.error;
      row = r.data;
    }
    if (err && (r.error?.message || "").includes("hotel_description")) {
      r = await supabaseAdmin.from("hotel_information").select("hotel_name, hotel_logo_url, hotel_logo_footter_url, hotel_bg_url").limit(1).maybeSingle();
      err = r.error;
      row = r.data;
    }
    if (err) throw err;

    const footerUrl = row?.hotel_logo_footter_url ?? row?.hotel_logo_url ?? null;
    return res.status(200).json({
      data: {
        hotelName: row?.hotel_name ?? "Neatly Hotel",
        hotelDescription: row?.hotel_description ?? null,
        hotelLogoUrl: row?.hotel_logo_url ?? null,
        hotelLogoFooterUrl: footerUrl,
        hotelBgUrl: row?.hotel_bg_url ?? null,
        hotelPhone: row?.hotel_phone ?? null,
        hotelEmail: row?.hotel_email ?? null,
        hotelLocation: row?.hotel_location ?? null,
      },
    });
  } catch (err) {
    console.error("[hotel-information] GET error:", err);
    return res.status(200).json({
      data: { hotelName: "Neatly Hotel", hotelDescription: null, hotelLogoUrl: null, hotelLogoFooterUrl: null, hotelBgUrl: null, hotelPhone: null, hotelEmail: null, hotelLocation: null },
    });
  }
}
