import { getBookingTrends } from "./bookingTrendsService";

/**
 * GET /api/admin/analytics/booking-trends?period=month
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export async function getBookingTrendsController(req, res) {
  const rawPeriod = Array.isArray(req.query.period)
    ? req.query.period[0]
    : req.query.period;

  const period = rawPeriod || "month";

  const result = await getBookingTrends(period);
  return res.status(200).json(result);
}

