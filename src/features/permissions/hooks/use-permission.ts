"use client";

import { usePermissions } from "@/providers/permission-provider";
import type { PermissionCheck } from "../types";

export function usePermission(): PermissionCheck {
  const { permissions, byPassAllFeatures, isLoading } = usePermissions();

  const permissionCodes = new Set(permissions.map((p) => p.code));

  const hasPermission = (code: string): boolean => {
    if (byPassAllFeatures) return true;
    return permissionCodes.has(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (byPassAllFeatures) return true;
    return codes.some((code) => permissionCodes.has(code));
  };

  const hasAllPermissions = (codes: string[]): boolean => {
    if (byPassAllFeatures) return true;
    return codes.every((code) => permissionCodes.has(code));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    byPassAllFeatures,
    isLoading,
  };
}
