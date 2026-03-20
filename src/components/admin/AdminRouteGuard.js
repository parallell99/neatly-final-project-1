"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/authentication";

const ADMIN_ROLE = "agent";

/**
 * Protects routes under /admin: only users with role === "agent" can access.
 * Others are redirected to home. Shows nothing while checking auth.
 */
export default function AdminRouteGuard({ children }) {
  const router = useRouter();
  const { userRole, getUserLoading, isAuthenticated } = useAuth();
  const isAdminPath = router.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminPath) return;
    if (getUserLoading) return;

    if (!isAuthenticated || userRole !== ADMIN_ROLE) {
      router.replace("/");
    }
  }, [isAdminPath, getUserLoading, isAuthenticated, userRole, router]);

  if (!isAdminPath) {
    return children;
  }

  if (getUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100" role="status" aria-label="Loading">
        <p className="text-gray-600">Admin guard is Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== ADMIN_ROLE) {
    return null;
  }

  return children;
}
