import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  PERIOD_CONFIG,
  PAGE_PATH,
  getTrafficChartRpc,
  getPageViewsSince,
} from "./trafficRepository";

/**
 * @param {string} period - realtime | yesterday | last_7_days | last_30_days
 * @param {string} page - all | homepage | search_rooms | ...
 * @returns {Promise<Array<{ label: string, value: number }>>}
 */
export async function getTrafficChart(period, page) {
  const config = PERIOD_CONFIG[period] ?? PERIOD_CONFIG.last_7_days;
  let pathFilter = null;
  if (page !== "all") {
    if (page.startsWith("room:")) {
      pathFilter = "/rooms/" + page.slice(5);
    } else {
      pathFilter = PAGE_PATH[page] ?? null;
    }
  }

  const { data, error } = await getTrafficChartRpc(supabaseAdmin, {
    interval: config.interval,
    groupBy: config.groupBy,
    pathFilter,
  });

  if (!error && Array.isArray(data)) return data;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("get_traffic_chart error:", error);
  }

  return fetchTrafficFallback(config, pathFilter);
}

/**
 * @param {{ interval: string, groupBy: string }} config
 * @param {string | null} pathFilter
 * @returns {Promise<Array<{ label: string, value: number }>>}
 */
async function fetchTrafficFallback(config, pathFilter) {
  const since = new Date(
    Date.now() - intervalToMs(config.interval)
  ).toISOString();
  const rows = await getPageViewsSince(supabaseAdmin, since);
  if (!rows.length) return [];

  let filtered = rows.filter(
    (r) => !r.path.startsWith("/admin") && !r.path.startsWith("/api")
  );

  if (pathFilter) {
    if (pathFilter.endsWith("%")) {
      const prefix = pathFilter.slice(0, -1);
      filtered = filtered.filter((r) => r.path.startsWith(prefix));
    } else {
      filtered = filtered.filter((r) => r.path === pathFilter);
    }
  }

  const groupBy = config.groupBy;
  const bucketKey = (visitedAt) => {
    const d = new Date(visitedAt);
    if (groupBy.includes("minute")) {
      d.setSeconds(0, 0);
      return d.toISOString().slice(0, 16);
    }
    if (groupBy.includes("hour")) {
      d.setMinutes(0, 0, 0);
      return d.toISOString().slice(0, 13);
    }
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };

  const map = new Map();
  for (const row of filtered) {
    const key = bucketKey(row.visited_at);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

export const trafficService = { getTrafficChart };

/** @param {string} interval - e.g. "7 days", "1 hour" */
function intervalToMs(interval) {
  const match = interval.match(
    /^(\d+)\s*(hour|day|minute|days?|hours?|minutes?)$/i
  );
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = Number(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit.startsWith("minute")) return num * 60 * 1000;
  if (unit.startsWith("hour")) return num * 60 * 60 * 1000;
  if (unit.startsWith("day")) return num * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}
