import { useState, useEffect } from "react";
import { differenceInDays, format } from "date-fns";
import {
  fetchOccupancyGuest,
  fetchOccupancyGuestLive,
} from "@/lib/analytics/fetchers";
import { transformOccupancyGuest } from "@/lib/analytics/transformers";

export function useOccupancyGuest(from, to, viewBy, granularity, useLive) {
  const [data, setData] = useState({
    occupancySeries: [],
    occupancyByRoomTypeSeries: [],
    roomTypes: [],
    guestVisit: { totalGuests: 0, segments: [] },
    paymentMethods: [],
  });
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    resolvedGranularity: granularity ?? "month",
    fetchGranularity: granularity ?? "month",
    didAutoGroup: false,
    reason: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const days = from && to ? Math.max(0, differenceInDays(to, from)) : 0;
        const sameMonth =
          from && to && format(from, "yyyy-MM") === format(to, "yyyy-MM");

        // UX-first auto grouping:
        // - overall: keep user's granularity, but force day when range is short
        // - room_types: keep monthly for up to ~6 months; beyond that group to quarter
        let resolvedGranularity = granularity || "month";
        let reason = null;

        if (viewBy === "room_types") {
          if (days > 180) {
            resolvedGranularity = "quarter";
            reason = "range_too_wide_room_types";
          } else {
            resolvedGranularity = "month";
            reason = granularity !== "month" ? "room_types_force_month" : null;
          }
        } else {
          if (days <= 30 || sameMonth) {
            resolvedGranularity = "day";
            reason = "short_range_force_day";
          }
        }

        // Backend/mock currently supports day/month. Quarter is grouped in transformer.
        const fetchGranularity =
          resolvedGranularity === "quarter" ? "month" : resolvedGranularity;

        const didAutoGroup = resolvedGranularity !== (granularity || "month");

        const res = useLive
          ? await fetchOccupancyGuestLive(from, to, fetchGranularity)
          : await fetchOccupancyGuest(
              from,
              to,
              viewBy,
              fetchGranularity
            );

        if (cancelled || !res) return;
        setMeta({ resolvedGranularity, fetchGranularity, didAutoGroup, reason });
        setData(
          transformOccupancyGuest(res.data, {
            resolvedGranularity,
            viewBy,
            dateFrom: from,
            dateTo: to,
          })
        );
      } catch {
        if (cancelled) return;
        setMeta({
          resolvedGranularity: granularity ?? "month",
          fetchGranularity: granularity ?? "month",
          didAutoGroup: false,
          reason: null,
        });
        setData({
          occupancySeries: [],
          occupancyByRoomTypeSeries: [],
          roomTypes: [],
          guestVisit: { totalGuests: 0, segments: [] },
          paymentMethods: [],
        });
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [from, to, viewBy, granularity, useLive]);

  return { data, loading, meta };
}

