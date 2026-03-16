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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const days = from && to ? differenceInDays(to, from) : 0;
        const sameMonth =
          from && to && format(from, "yyyy-MM") === format(to, "yyyy-MM");
        const effectiveGranularity =
          days <= 30 || sameMonth ? "day" : granularity;

        const res = useLive
          ? await fetchOccupancyGuestLive(from, to, effectiveGranularity)
          : await fetchOccupancyGuest(
              from,
              to,
              viewBy,
              effectiveGranularity
            );

        if (cancelled || !res) return;
        setData(transformOccupancyGuest(res.data));
      } catch {
        if (cancelled) return;
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

  return { data, loading };
}

