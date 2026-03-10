"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check } from "lucide-react";

const COPIED_DURATION_MS = 2000;

/**
 * Format end_date for display. Null = no expiry.
 */
function formatExpiry(endDate) {
  if (!endDate) return null;
  const d = new Date(endDate);
  if (Number.isNaN(d.getTime())) return endDate;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Reusable promotion card for Special Offers page.
 * Shows title, code, discount description, expiry, and Copy Code button with feedback.
 * @param {Object} promotion - From DB: name, code, description, discount_type, discount_value, min_spend, end_date, global_usage_limit, usage_limit_per_user
 */
export default function PromotionCard({ promotion }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const code = promotion?.code?.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (_) {
      setCopied(false);
    }
  }, [promotion?.code]);

  if (!promotion) return null;

  const { name, code, description, end_date, discount_type, discount_value, min_spend, global_usage_limit, usage_limit_per_user } = promotion;
  const expiryFormatted = formatExpiry(end_date);

  return (
    <article
      className="relative flex flex-col rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg border border-gray-100"
      data-testid="promotion-card"
    >
      {/* Popover: Copied! at bottom-right of viewport, white bg, black text */}
      {copied && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-black shadow-lg border border-gray-200"
          role="status"
          aria-live="polite"
        >
          <Check className="w-4 h-4 shrink-0 text-black" aria-hidden />
          <span className="text-sm font-medium text-black">Copied!</span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {name || "Special Offer"}
      </h3>

      {/* Code badge */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-800 font-mono font-semibold text-sm">
          {code || "—"}
        </span>
      </div>

      {/* Discount description (from DB or derived) */}
      <p className="text-gray-600 text-sm leading-relaxed mb-3">
        {description || getDefaultDescription(promotion)}
      </p>

      {/* Expiry */}
      {expiryFormatted ? (
        <p className="text-gray-500 text-xs mb-4">
          Valid until {expiryFormatted}
        </p>
      ) : (
        <p className="text-gray-500 text-xs mb-4">
          No expiry
        </p>
      )}

      {/* Copy Code button */}
      <button
        type="button"
        onClick={handleCopy}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label={copied ? "Code copied" : "Copy promotion code"}
      >
        <Copy className="w-4 h-4 shrink-0" aria-hidden />
        <span>Copy Code</span>
      </button>
    </article>
  );
}

function getDefaultDescription(p) {
  const type = (p?.discount_type || "percent").toLowerCase();
  const normalizedType = type === "percentage" ? "percent" : type;
  const val = Number(p?.discount_value) ?? 0;
  const min = p?.min_spend != null ? Number(p.min_spend) : 0;
  const parts = [];

  if (normalizedType === "fixed") {
    parts.push(`${val.toLocaleString()} THB off`);
  } else {
    parts.push(`${val}% off`);
  }

  if (min > 0) {
    parts.push(`Minimum spend ${min.toLocaleString()} THB`);
  }
  if (p?.global_usage_limit != null && Number.isFinite(Number(p.global_usage_limit))) {
    parts.push(`Limited to first ${p.global_usage_limit} uses`);
  }
  if (p?.usage_limit_per_user != null && Number(p.usage_limit_per_user) === 1) {
    parts.push("First booking only");
  }

  return parts.length > 0 ? parts.join(". ") : "Special offer.";
}
