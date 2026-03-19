import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { CalendarPlus } from "lucide-react";

const NOTIFICATION_READ_KEY = "neatly_admin_orders_read_at";

function getReadAt() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NOTIFICATION_READ_KEY);
  } catch {
    return null;
  }
}

function setReadAtNow() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFICATION_READ_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export default function AgentNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newOrdersList, setNewOrdersList] = useState([]);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const countUrl = useMemo(() => {
    let url = "/api/admin/orders-new-count";
    const readAt = getReadAt();
    if (readAt) url += "?since=" + encodeURIComponent(readAt);
    return url;
  }, []);

  // Poll new orders count every minute (agent)
  useEffect(() => {
    const fetchCount = () => {
      // recompute each time in case readAt changes
      let url = "/api/admin/orders-new-count";
      const readAt = getReadAt();
      if (readAt) url += "?since=" + encodeURIComponent(readAt);
      fetch(url)
        .then((res) => res.json())
        .then((json) => setNewOrdersCount(json?.count ?? 0))
        .catch(() => setNewOrdersCount(0));
    };
    fetchCount();
    const intervalId = setInterval(fetchCount, 60_000);
    return () => clearInterval(intervalId);
  }, [countUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllAsRead = () => {
    setReadAtNow();
    setNewOrdersCount(0);
  };

  const openAndFetch = () => {
    setOpen(true);
    fetch("/api/admin/orders-list")
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json?.data) ? json.data : [];
        setNewOrdersList(list);
      })
      .catch(() => setNewOrdersList([]));
  };

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) openAndFetch();
      else setNewOrdersList([]);
      return next;
    });
  };

  const handleItemClick = () => {
    markAllAsRead();
    setOpen(false);
    router.push("/admin/customer-booking");
  };

  const readAtMs = (() => {
    const readAt = getReadAt();
    if (!readAt) return null;
    const t = new Date(readAt).getTime();
    return Number.isNaN(t) ? null : t;
  })();

  const isUnreadOrder = (order) => {
    if (!readAtMs) return true;
    const t = order?.createdAt ? new Date(order.createdAt).getTime() : null;
    if (!t || Number.isNaN(t)) return false;
    return t >= readAtMs;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggle}
        className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {newOrdersCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full leading-none">
            {newOrdersCount > 99 ? "99+" : newOrdersCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-[-50px] mt-2 w-[calc(100vw-24px)] max-w-[340px] max-h-[70dvh] sm:max-h-[420px] bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-800 text-sm font-sans">
                Notifications
              </span>
              {newOrdersCount > 0 && (
                <span className="text-xs text-gray-400 font-sans">
                  {newOrdersCount} unread
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={newOrdersCount === 0}
              className="text-xs text-orange-500 hover:text-orange-600 disabled:text-gray-300 disabled:hover:text-gray-300 font-medium font-sans cursor-pointer transition-colors"
            >
              Mark all as read
            </button>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {newOrdersList.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm font-sans">
                No orders yet.
              </p>
            ) : (
              newOrdersList.slice(0, 10).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={handleItemClick}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <span className="shrink-0 mt-0.5 text-gray-600" aria-hidden="true">
                    <CalendarPlus size={18} className="text-gray-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-semibold font-sans truncate">
                      {order.customerName || "—"}
                    </p>
                    <p className="text-gray-600 text-xs font-sans leading-snug mt-0.5">
                      {order.roomType || "—"} · Check-in{" "}
                      {String(order.checkIn).slice(0, 10)}
                    </p>
                  </div>
                  {isUnreadOrder(order) ? (
                    <span
                      className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500"
                      aria-label="Unread"
                    />
                  ) : null}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            <button
              type="button"
              className="inline-block text-orange-500 font-sans text-sm hover:underline font-medium cursor-pointer"
              onClick={handleItemClick}
            >
              View Customer Booking →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

