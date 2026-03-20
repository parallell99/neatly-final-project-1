import { useState, useEffect, useCallback } from "react";

/**
 * Hook to manage hotel booking notifications from the Supabase "notifications" table.
 * - Fetches up to 50 most recent notifications for the current user
 * - Subscribes to real-time INSERT events filtered by user_id
 * - Exposes markAsRead and markAllAsRead helpers
 *
 * @param {object|null} user - The authenticated user's object
 */
export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const userId = user?.id ?? null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) {
      setNotifications([]);
      return;
    }

    const response = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    if (response.ok) {
      setNotifications(json?.notifications ?? []);
      return;
    }
    console.error("[useNotifications] fetch error:", json?.error || "Unknown error");
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling fallback every 20 seconds (works with app auth token consistently)
  useEffect(() => {
    if (!userId) return;
    const intervalId = setInterval(fetchNotifications, 20_000);
    return () => clearInterval(intervalId);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      if (!id) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (!token) return;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAll: true }),
    });
  }, [userId]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
