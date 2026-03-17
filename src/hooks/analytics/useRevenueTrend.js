import { useState, useEffect } from "react";
import {
  fetchRevenueTrend,
  fetchRevenueTrendLive,
} from "@/lib/analytics/fetchers";
import { transformRevenueTrend } from "@/lib/analytics/transformers";

export function useRevenueTrend(dateFrom, dateTo, mode, useLive) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const res = useLive
          ? await fetchRevenueTrendLive(dateFrom, dateTo, mode)
          : await fetchRevenueTrend(dateFrom, dateTo, mode);

        if (cancelled || !res) return;
        const { data: transformed } = transformRevenueTrend(res);
        setData(transformed);
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
  }, [dateFrom, dateTo, mode, useLive]);

  return { data, loading };
}

