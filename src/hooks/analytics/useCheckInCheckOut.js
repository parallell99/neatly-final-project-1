import { useState, useEffect } from "react";
import { fetchCheckInCheckOutAverages } from "@/lib/analytics/fetchers";

export function useCheckInCheckOut() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchCheckInCheckOutAverages();
        if (cancelled || !res) return;
        setData(res.data);
      } catch {
        if (cancelled) return;
        setData(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

