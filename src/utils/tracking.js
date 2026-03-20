// Utility helpers for website traffic tracking
// - getVisitorId: stable ID across sessions (localStorage)
// - getSessionId: ID per browser session (sessionStorage)
// - getJwtPayload: decode JWT stored in localStorage under "token"

export const getVisitorId = () => {
  if (typeof window === "undefined") return null;

  let vid = window.localStorage.getItem("vid");
  if (!vid) {
    const uuid =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    vid = uuid;
    window.localStorage.setItem("vid", vid);
  }

  return vid;
};

export const getSessionId = () => {
  if (typeof window === "undefined") return null;

  let sid = window.sessionStorage.getItem("sid");
  if (!sid) {
    const uuid =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    sid = uuid;
    window.sessionStorage.setItem("sid", sid);
  }

  return sid;
};

export const getJwtPayload = () => {
  if (typeof window === "undefined") return null;

  try {
    const token = window.localStorage.getItem("token");
    if (!token) return null;

    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;

    const jsonPayload = atob(base64Payload);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

