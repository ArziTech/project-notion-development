"use server";

import { prisma } from "@/lib/prisma";

/**
 * Check if role has bypass all features (superadmin)
 */
async function isSuperAdmin(roleId: number): Promise<boolean> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { byPassAllFeatures: true },
  });
  return role?.byPassAllFeatures ?? false;
}

/**
 * Server action: Check if user has permission
 * Returns true if user has the specified permission
 */
export async function hasServerPermission(
  roleId: number,
  permission: string,
): Promise<boolean> {
  try {
    // Superadmin bypass
    if (await isSuperAdmin(roleId)) {
      return true;
    }

    // Check if role has the specific permission
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        permission: {
          code: permission,
          isActive: true,
        },
      },
    });

    return !!rolePermission;
  } catch {
    return false;
  }
}

/**
 * Server action: Check if user has ANY of the specified permissions
 * Returns true if user has at least one of the permissions
 */
export async function hasAnyServerPermission(
  roleId: number,
  permissions: string[],
): Promise<boolean> {
  try {
    // Superadmin bypass
    if (await isSuperAdmin(roleId)) {
      return true;
    }

    // Check if role has any of the permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          code: { in: permissions },
          isActive: true,
        },
      },
    });

    return rolePermissions.length > 0;
  } catch {
    return false;
  }
}

/**
 * Server action: Check if user has ALL of the specified permissions
 * Returns true if user has all permissions
 */
export async function hasAllServerPermissions(
  roleId: number,
  permissions: string[],
): Promise<boolean> {
  try {
    // Superadmin bypass
    if (await isSuperAdmin(roleId)) {
      return true;
    }

    // Check if role has all permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          code: { in: permissions },
          isActive: true,
        },
      },
      include: {
        permission: {
          select: { code: true },
        },
      },
    });

    const uniquePermissions = new Set(
      rolePermissions.map((rp) => rp.permission.code),
    );
    return permissions.every((p) => uniquePermissions.has(p));
  } catch {
    return false;
  }
}
