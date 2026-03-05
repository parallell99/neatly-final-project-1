// Mock order generator for analytics dashboard revenue trend.
// Generates deterministic-looking seasonal revenue data between 2025 and today.

// ── Seasonal config ────────────────────────────────────────────
// multiplier บอกว่าช่วงนี้ busy แค่ไหน เทียบกับ baseline
export const SEASONAL_CONFIG = [
  { month: 1,  name: "Jan", roomMultiplier: 0.9,  priceMultiplier: 1.1  }, // High (ปีใหม่)
  { month: 2,  name: "Feb", roomMultiplier: 0.7,  priceMultiplier: 1.0  }, // Mid
  { month: 3,  name: "Mar", roomMultiplier: 0.6,  priceMultiplier: 0.9  }, // Low
  { month: 4,  name: "Apr", roomMultiplier: 1.0,  priceMultiplier: 1.3  }, // High (สงกรานต์)
  { month: 5,  name: "May", roomMultiplier: 0.4,  priceMultiplier: 0.8  }, // Low
  { month: 6,  name: "Jun", roomMultiplier: 0.4,  priceMultiplier: 0.8  }, // Low
  { month: 7,  name: "Jul", roomMultiplier: 0.5,  priceMultiplier: 0.85 }, // Low-Mid
  { month: 8,  name: "Aug", roomMultiplier: 0.5,  priceMultiplier: 0.85 }, // Low-Mid
  { month: 9,  name: "Sep", roomMultiplier: 0.35, priceMultiplier: 0.75 }, // Lowest
  { month: 10, name: "Oct", roomMultiplier: 0.6,  priceMultiplier: 0.9  }, // Mid
  { month: 11, name: "Nov", roomMultiplier: 0.8,  priceMultiplier: 1.05 }, // High
  { month: 12, name: "Dec", roomMultiplier: 1.0,  priceMultiplier: 1.3  }, // Peak (คริสต์มาส/ปีใหม่)
];

const WEEKEND_ROOM_BOOST = 1.4;
const WEEKEND_PRICE_BOOST = 1.15;

const BASE_ROOMS_PER_DAY = 10;
const BASE_PRICE_MIN = 2000;
const BASE_PRICE_MAX = 4500;

export function generateMockOrders(year) {
  const orders = [];
  const startDate = new Date(`${year}-01-01`);
  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const endDate = isCurrentYear ? today : new Date(`${year}-12-31`);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const season = SEASONAL_CONFIG.find((s) => s.month === month);
    const roomMult  = season.roomMultiplier  * (isWeekend ? WEEKEND_ROOM_BOOST  : 1);
    const priceMult = season.priceMultiplier * (isWeekend ? WEEKEND_PRICE_BOOST : 1);

    const avgRooms = BASE_ROOMS_PER_DAY * roomMult;
    const noise = (Math.random() - 0.5) * 4; // ±2
    const roomsPerDay = Math.max(0, Math.round(avgRooms + noise));

    for (let i = 0; i < roomsPerDay; i++) {
      const checkInOffset = Math.floor(Math.random() * 30);
      const checkInDate = new Date(date);
      checkInDate.setDate(checkInDate.getDate() + checkInOffset);

      const basePrice = BASE_PRICE_MIN + Math.random() * (BASE_PRICE_MAX - BASE_PRICE_MIN);

      orders.push({
        created_at:    date.toISOString().split("T")[0],
        check_in_date: checkInDate.toISOString().split("T")[0],
        total_price:   Number((basePrice * priceMult).toFixed(2)),
      });
    }
  }

  return orders;
}

// Pre-generated dataset: mock ตั้งแต่ปี 2025 ถึงปีปัจจุบัน (จำกัดถึงวันนี้)
export const MOCK_ORDERS = (() => {
  const today = new Date();
  const orders = [];
  for (let year = 2025; year <= today.getFullYear(); year += 1) {
    orders.push(...generateMockOrders(year));
  }
  return orders;
})();
