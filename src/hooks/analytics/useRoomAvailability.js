import { useState, useEffect } from "react";
import { fetchRoomAvailability } from "@/lib/analytics/fetchers";
import { transformRoomAvailability } from "@/lib/analytics/transformers";

export function useRoomAvailability(period) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetchRoomAvailability(period);
        if (cancelled || !res) return;
        setData(transformRoomAvailability(res));
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
  }, [period]);

  return { data, loading };
}

