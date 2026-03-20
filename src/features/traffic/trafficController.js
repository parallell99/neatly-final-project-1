import { trafficService } from "./trafficService";

/**
 * GET /api/traffic?period=last_7_days&page=all
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export async function getTrafficController(req, res) {
  const rawPeriod = Array.isArray(req.query.period)
    ? req.query.period[0]
    : req.query.period;
  const rawPage = Array.isArray(req.query.page)
    ? req.query.page[0]
    : req.query.page;

  const period = rawPeriod || "last_7_days";
  const page = rawPage || "all";

  const data = await trafficService.getTrafficChart(period, page);
  return res.status(200).json(Array.isArray(data) ? data : []);
}
