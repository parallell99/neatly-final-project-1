import { getOccupancyGuest } from "./occupancyGuestService";

/**
 * GET /api/admin/analytics/occupancy-guest?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|month
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export async function getOccupancyGuestController(req, res) {
  const rawFrom = Array.isArray(req.query.from)
    ? req.query.from[0]
    : req.query.from;
  const rawTo = Array.isArray(req.query.to) ? req.query.to[0] : req.query.to;
  const rawGranularity = Array.isArray(req.query.granularity)
    ? req.query.granularity[0]
    : req.query.granularity;

  const granularity =
    rawGranularity === "day" || rawGranularity === "month"
      ? rawGranularity
      : "month";

  if (!rawFrom || !rawTo) {
    return res.status(400).json({
      error: "Missing required params: from, to",
    });
  }

  try {
    const result = await getOccupancyGuest(rawFrom, rawTo, granularity);
    return res.status(200).json(result);
  } catch (err) {
    if (err.message?.includes("Invalid date")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("[occupancy-guest] error:", err);
    return res
      .status(500)
      .json({ error: err.message ?? "Internal server error" });
  }
}
