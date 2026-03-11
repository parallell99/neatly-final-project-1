import { getRevenueTrend } from "./revenueTrendsService";

/**
 * GET /api/admin/analytics/revenue-trend
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export async function getRevenueTrendController(req, res) {
  const { from, to, mode = "booking_date" } = req.query;
  const result = await getRevenueTrend(from, to, mode);
  return res.status(200).json(result);
}

