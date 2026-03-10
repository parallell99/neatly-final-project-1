import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Real-time / polling updater for website traffic analytics.
 *
 * - For "realtime" period: subscribe to Supabase Postgres changes on page_views
 * - For other periods: simple polling every 30 seconds
 *
 * @param {string} periodId
 * @param {() => void} onUpdate - callback to refetch traffic data
 */
export function useTrafficRealtime(periodId, onUpdate) {
  useEffect(() => {
    if (typeof onUpdate !== "function") return;

    // For non-realtime periods, use lightweight polling
    if (periodId !== "realtime") {
      const intervalId = setInterval(onUpdate, 30_000);
      return () => clearInterval(intervalId);
    }

    // For "realtime" use Supabase realtime channel
    const channel = supabase
      .channel("page_views_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "page_views" },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periodId, onUpdate]);
}

