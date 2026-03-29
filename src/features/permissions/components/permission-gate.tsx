"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { usePermission } from "@/features/permissions/hooks/use-permission";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  redirectTo?: string;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  loadingFallback = null,
  redirectTo,
}: PermissionGateProps) {
  const router = useRouter();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    byPassAllFeatures,
    isLoading,
  } = usePermission();

  // Superadmin bypass - check this FIRST
  if (byPassAllFeatures) {
    return <>{children}</>;
  }

  // Show loading fallback while loading
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  // Handle redirect when access is denied
  if (!hasAccess && redirectTo) {
    // Only redirect on the client side, not during SSR
    if (typeof window !== "undefined") {
      router.push(redirectTo);
    }
    return fallback;
  }

  return hasAccess ? children : fallback;
}
