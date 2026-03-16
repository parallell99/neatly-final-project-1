import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTrafficRealtime } from "@/hooks/useTrafficRealtime";

export function useTrafficData(period, page) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomOptions, setRoomOptions] = useState([]);

  const fetchTrafficData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("token")
          : null;
      const res = await axios.get("/api/traffic", {
        params: { period, page },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const nextData = res.data;
      setData(Array.isArray(nextData) ? nextData : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        await fetchTrafficData();
      } finally {
        if (cancelled) return;
        // loading state already handled in fetchTrafficData finally; keep here for safety
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchTrafficData]);

  useTrafficRealtime(period, fetchTrafficData);

  useEffect(() => {
    let cancelled = false;

    async function loadRoomOptions() {
      try {
        const res = await fetch("/api/rooms/rooms-all");
        const json = await res.json();
        if (cancelled) return;
        const list = json?.data ?? [];
        const options = list
          .map((r) => {
            const name = r.name ?? r.title ?? "";
            const slug = (name || "")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            if (!slug) return null;
            return { id: `room:${slug}`, label: name || "Room" };
          })
          .filter(Boolean);
        setRoomOptions(options);
      } catch {
        if (cancelled) return;
        setRoomOptions([]);
      }
    }

    loadRoomOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, roomOptions };
}

