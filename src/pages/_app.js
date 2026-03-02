import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/authentication";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AdminRouteGuard>
        <Component {...pageProps} />
      </AdminRouteGuard>
    </AuthProvider>
  );
}
