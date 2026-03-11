import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { AuthProvider } from "@/contexts/authentication";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { getVisitorId, getSessionId, getJwtPayload } from "@/utils/tracking";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const trackPageView = async (url) => {
      //if (process.env.NODE_ENV === "development") return;

      const path = url.split("?")[0];
      if (path.startsWith("/admin")) return;

      const payload = getJwtPayload();
      const { error } = await supabase.from("page_views").insert({
        path: url,
        session_id: payload?.session_id ?? getSessionId(),
        visitor_id: getVisitorId(),
        user_id: payload?.sub ?? null,
      });

    };

    trackPageView(router.asPath);
    router.events.on("routeChangeComplete", trackPageView);
    return () => {
      router.events.off("routeChangeComplete", trackPageView);
    };
  }, [router]);

  return (
    <AuthProvider>
      <AdminRouteGuard>
        <Component {...pageProps} />
      </AdminRouteGuard>
    </AuthProvider>
  );
}

