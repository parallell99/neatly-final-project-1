import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code, subtotal, appliedPromotionIds } = req.query ?? {};

  if (!code || typeof code !== "string") {
    return res.status(400).json({ message: "Missing code" });
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return res.status(400).json({ message: "Missing code" });
  }

  const subtotalNum = subtotal != null ? Number(subtotal) : 0;
  const appliedIdsRaw = appliedPromotionIds;
  const appliedIds = (
    typeof appliedIdsRaw === "string"
      ? appliedIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
      : Array.isArray(appliedIdsRaw)
        ? appliedIdsRaw.filter((id) => id != null && String(id).trim() !== "")
        : []
  );

  try {
    const { data: promotion, error } = await supabaseAdmin
      .from("promotions")
      // use * so DB can evolve (e.g. per-user limits)
      .select("*")
      .ilike("code", trimmedCode)
      .maybeSingle();

    if (error) {
      console.error("Fetch promotion failed:", error);
      return res.status(500).json({ message: "Failed to load promotion" });
    }

    if (!promotion) {
      return res.status(404).json({ message: "This promotional code is invalid or has expired" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (promotion.start_date) {
      const start = new Date(promotion.start_date);
      start.setHours(0, 0, 0, 0);
      if (today < start) {
        return res.status(400).json({ message: "This promotional code is not yet valid" });
      }
    }

    if (promotion.end_date) {
      const end = new Date(promotion.end_date);
      end.setHours(23, 59, 59, 999);
      if (today > end) {
        return res.status(400).json({ message: "This promotional code has expired" });
      }
    }

    const minSpend = promotion.min_spend != null ? Number(promotion.min_spend) : 0;
    if (minSpend > 0 && subtotalNum < minSpend) {
      return res.status(400).json({
        message: `Minimum spend of ${minSpend.toLocaleString()} THB required for this code`,
      });
    }

    if (promotion.global_usage_limit != null) {
      const limit = Number(promotion.global_usage_limit);
      if (Number.isFinite(limit) && limit >= 0) {
        const { count, error: countError } = await supabaseAdmin
          .from("promotion_usages")
          .select("*", { count: "exact", head: true })
          .eq("promotion_id", promotion.id);

        if (!countError && count != null && count >= limit) {
          return res.status(400).json({ message: "This promotional code has reached its usage limit" });
        }
      }
    }

    // --- per-user usage limit ---
    // DB rule: usage_limit_per_user = null => unlimited per user (until expired)
    // Otherwise, user can use this code up to usage_limit_per_user times.
    const perUserLimitRaw = promotion.usage_limit_per_user ?? null;
    const perUserLimit = perUserLimitRaw != null ? Number(perUserLimitRaw) : null;

    if (perUserLimit != null && Number.isFinite(perUserLimit) && perUserLimit <= 0) {
      return res.status(400).json({ message: "This promotional code cannot be used" });
    }

    if (perUserLimit != null && Number.isFinite(perUserLimit) && perUserLimit > 0) {
      const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ message: "Missing Supabase env vars" });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }

      const { count, error: userCountError } = await supabaseAdmin
        .from("promotion_usages")
        .select("*", { count: "exact", head: true })
        .eq("promotion_id", promotion.id)
        .eq("user_id", user.id);

      if (!userCountError && count != null && count >= perUserLimit) {
        return res.status(400).json({ message: "You have already used this promotion code" });
      }
    }

    const isStackable = promotion.is_stackable === true;

    if (appliedIds.length > 0) {
      if (!isStackable) {
        return res.status(400).json({
          message: "This code cannot be combined with other codes",
        });
      }

      const { data: appliedPromos } = await supabaseAdmin
        .from("promotions")
        .select("id, is_stackable")
        .in("id", appliedIds);

      const hasNonStackable = (appliedPromos ?? []).some((p) => p.is_stackable !== true);
      if (hasNonStackable) {
        return res.status(400).json({
          message: "Cannot add another code when a non-stackable code is already applied",
        });
      }
    }

    const discountType = (promotion.discount_type || "percent").toLowerCase();
    const discountValue = Number(promotion.discount_value) || 0;
    const discountPct = promotion.discount_percentage != null ? Number(promotion.discount_percentage) : null;

    let discountAmount = 0;
    if (discountType === "fixed") {
      discountAmount = Math.min(discountValue, Math.max(0, subtotalNum));
    } else {
      const pct = discountPct != null ? discountPct : discountValue;
      discountAmount = (subtotalNum * pct) / 100;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    return res.status(200).json({
      promotion: {
        ...promotion,
        is_stackable: !!isStackable,
        discountAmount,
      },
    });
  } catch (err) {
    console.error("Promotion API error:", err);
    return res.status(500).json({ message: "Failed to validate promotion" });
  }
}
