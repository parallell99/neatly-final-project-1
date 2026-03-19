import {
  CalendarCheck,
  CreditCard,
  X,
  RotateCcw,
  BellRing,
} from "lucide-react";

/**
 * Returns an icon (Lucide) representing the notification type.
 * @param {"new_booking"|"payment_success"|"booking_cancelled"|"booking_refunded"|"checkin_reminder"|string} type
 * @returns {import("react").ReactNode}
 */
export function getNotificationIcon(type) {
  switch (type) {
    case "new_booking":
      return <CalendarCheck size={18} className="text-gray-600" />;
    case "payment_success":
      return <CreditCard size={18} className="text-gray-600" />;
    case "booking_cancelled":
      return <X size={18} className="text-gray-600" />;
    case "booking_refunded":
      return <RotateCcw size={18} className="text-gray-600" />;
    case "checkin_reminder":
      return <BellRing size={18} className="text-gray-600" />;
    default:
      return <BellRing size={18} className="text-gray-400" />;
  }
}

/**
 * Returns a Thai-style relative time string 
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDay / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
