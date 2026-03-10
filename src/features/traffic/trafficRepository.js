/**
 * Traffic analytics – data access (RPC + raw page_views).
 * RPC get_traffic_chart excludes path LIKE '/admin%' in SQL.
 */

export const PERIOD_CONFIG = {
  realtime: {
    interval: "1 hour",
    groupBy: "date_trunc('minute', visited_at)",
  },
  yesterday: {
    interval: "1 day",
    groupBy: "date_trunc('hour', visited_at)",
  },
  last_7_days: {
    interval: "7 days",
    groupBy: "date_trunc('day', visited_at)",
  },
  last_30_days: {
    interval: "30 days",
    groupBy: "date_trunc('day', visited_at)",
  },
};

/** pageId → path (exact or prefix with /rooms/%) */
export const PAGE_PATH = {
  homepage: "/",
  search_rooms: "/search-rooms",
  booking: "/booking",
  booking_action: "/booking-action",
  login: "/login",
  register: "/register",
  user_profile: "/userProfile",
  payment_method: "/payment-method",
  room_details: "/rooms/%",
};

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ interval: string, groupBy: string, pathFilter: string | null }} params
 * @returns {Promise<{ data: Array<{ label: string, value: number }> | null, error: import("@supabase/supabase-js").PostgrestError | null }>}
 */
export async function getTrafficChartRpc(supabase, params) {
  const { data, error } = await supabase.rpc("get_traffic_chart", {
    p_interval: params.interval,
    p_group_by: params.groupBy,
    p_path_filter: params.pathFilter,
  });
  return { data, error };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} since - ISO date string
 * @returns {Promise<Array<{ path: string, visited_at: string }>>}
 */
export async function getPageViewsSince(supabase, since) {
  const { data, error } = await supabase
    .from("page_views")
    .select("path, visited_at")
    .gte("visited_at", since);

  if (error || !data) return [];
  return data;
}
