import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (!["GET", "POST", "PATCH"].includes(req.method)) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("promotions")
        .select("id, name, code, description, discount_type, discount_value, max_discount, min_spend, start_date, end_date, is_stackable, global_usage_limit, usage_limit_per_user, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[admin/promotion/promotions] list error:", error);
        // Avoid breaking admin UI on transient Supabase/Vercel issues
        return res.status(200).json({ data: [] });
      }
      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      const {
        name,
        code,
        description,
        discount_type,
        discount_value,
        max_discount,
        min_spend,
        start_date,
        end_date,
        is_stackable,
        global_usage_limit,
        usage_limit_per_user,
      } = req.body ?? {};

      if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ message: "Code is required" });
      }

      const trimCode = code.trim().toUpperCase();

      const { data: existing } = await supabaseAdmin
        .from("promotions")
        .select("id")
        .ilike("code", trimCode)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ message: "Promotion code already exists" });
      }

      const insert = {
        name: name?.trim() || trimCode,
        code: trimCode,
        description: description?.trim() || null,
        discount_type: (discount_type || "percent").toLowerCase() === "fixed" ? "fixed" : "percent",
        discount_value: Number(discount_value) ?? 0,
        max_discount: max_discount != null && max_discount !== "" ? Number(max_discount) : null,
        min_spend: min_spend != null ? Number(min_spend) : 0,
        start_date: start_date || null,
        end_date: end_date || null,
        is_stackable: !!is_stackable,
        global_usage_limit: global_usage_limit != null ? Number(global_usage_limit) : null,
        usage_limit_per_user: usage_limit_per_user != null ? Number(usage_limit_per_user) : null,
        is_active: true,
      };

      const { data, error } = await supabaseAdmin
        .from("promotions")
        .insert(insert)
        .select()
        .single();

      if (error) {
        console.error("[admin/promotion/promotions] create error:", error);
        return res.status(500).json({ message: error.message || "Failed to create promotion" });
      }
      return res.status(201).json({ data });
    }

    if (req.method === "PATCH") {
      const { id, close, ...fields } = req.body ?? {};
      if (!id) return res.status(400).json({ message: "Promotion id is required" });

      const update = {};
      if (close === true) {
        update.is_active = false;
      }
      if (fields.name !== undefined) update.name = String(fields.name || "").trim();
      if (fields.code !== undefined) update.code = String(fields.code || "").trim().toUpperCase();
      if (fields.description !== undefined) update.description = fields.description?.trim() || null;
      if (fields.discount_type !== undefined) update.discount_type = (fields.discount_type || "percent").toLowerCase() === "fixed" ? "fixed" : "percent";
      if (fields.discount_value !== undefined) update.discount_value = Number(fields.discount_value) ?? 0;
      if (fields.max_discount !== undefined) update.max_discount = fields.max_discount != null && fields.max_discount !== "" ? Number(fields.max_discount) : null;
      if (fields.min_spend !== undefined) update.min_spend = Number(fields.min_spend) ?? 0;
      if (fields.start_date !== undefined) update.start_date = fields.start_date || null;
      if (fields.end_date !== undefined) update.end_date = fields.end_date || null;
      if (fields.is_stackable !== undefined) update.is_stackable = !!fields.is_stackable;
      if (fields.global_usage_limit !== undefined) update.global_usage_limit = fields.global_usage_limit != null ? Number(fields.global_usage_limit) : null;
      if (fields.usage_limit_per_user !== undefined) update.usage_limit_per_user = fields.usage_limit_per_user != null ? Number(fields.usage_limit_per_user) : null;
      if (fields.is_active !== undefined) update.is_active = !!fields.is_active;

      if (Object.keys(update).length === 0) {
        return res.status(200).json({ data: null });
      }

      const { data, error } = await supabaseAdmin
        .from("promotions")
        .update(update)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[admin/promotion/promotions] update error:", error);
        return res.status(500).json({ message: error.message || "Failed to update promotion" });
      }
      return res.status(200).json({ data });
    }
  } catch (err) {
    console.error("[admin/promotion/promotions] unexpected error:", err);
    // Avoid breaking admin UI on transient Supabase/Vercel issues
    return res.status(200).json({ data: [] });
  }
}
