import { useState, useEffect } from "react";
import {
  fetchBookingTrends,
  fetchBookingTrendsLive,
} from "@/lib/analytics/fetchers";
import { transformBookingTrends } from "@/lib/analytics/transformers";

export function useBookingTrends(period, useLive) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const res = useLive
          ? await fetchBookingTrendsLive(period)
          : await fetchBookingTrends(period);

        if (cancelled || !res) return;
        setData(transformBookingTrends(res));
      } catch {
        if (cancelled) return;
        setData([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [period, useLive]);

  return { data, loading };
}

