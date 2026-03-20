import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationIcon, formatRelativeTime } from "@/lib/notificationHelpers";

/**
 * Notification bell button with dropdown panel.
 * Shows unread badge count, a list of notifications, and mark-as-read controls.
 *
 * @param {{ user: object|null }} props
 */
export default function NotificationBell({ user }) {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(user);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

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

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    router.push("/booking-history");
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 relative hover:opacity-80 transition-opacity cursor-pointer"
      >
        {/* Bell icon */}
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

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-[-50px] mt-2 w-[calc(100vw-24px)] max-w-[340px] max-h-[70dvh] sm:max-h-[420px] bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="font-semibold text-gray-800 text-sm font-sans">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium font-sans cursor-pointer transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm font-sans">
                No notifications yet.
              </p>
            ) : (
              notifications.map((noti) => (
                <button
                  key={noti.id}
                  type="button"
                  onClick={() => handleItemClick(noti)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  {/* Type icon */}
                  <span
                    className="shrink-0 mt-0.5 text-gray-600"
                    aria-hidden="true"
                  >
                    {getNotificationIcon(noti.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {noti.title && (
                      <p className="text-gray-800 text-sm font-semibold font-sans truncate">
                        {noti.title}
                      </p>
                    )}
                    <p className="text-gray-600 text-xs font-sans leading-snug mt-0.5">
                      {noti.message}
                    </p>
                    <p className="text-gray-400 text-xs font-sans mt-1">
                      {formatRelativeTime(noti.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!noti.is_read && (
                    <span
                      className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500"
                      aria-label="Unread"
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
