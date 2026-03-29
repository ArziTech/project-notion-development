import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "";

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ==================== DEFINE DATA ====================

  // Roles
  const roles = [
    {
      name: "SUPERADMIN",
      description: "Super administrator with full bypass access",
      byPassAllFeatures: true,
      isActive: true,
    },
    {
      name: "ADMIN",
      description: "Administrator with management access",
      byPassAllFeatures: false,
      isActive: true,
    },
    {
      name: "USER",
      description: "Regular user with limited access",
      byPassAllFeatures: false,
      isActive: true,
    },
  ];

  // Users (passwords will be hashed before insertion)
  const users = [
    {
      username: "superadmin",
      name: "Super Administrator",
      email: "superadmin@example.com",
      plainPassword: "super123",
      roleName: "SUPERADMIN",
    },
    {
      username: "admin",
      name: "Administrator",
      email: "admin@example.com",
      plainPassword: "admin123",
      roleName: "ADMIN",
    },
    {
      username: "user",
      name: "Regular User",
      email: "user@example.com",
      plainPassword: "user123",
      roleName: "USER",
    },
  ];

  // Permissions - Section only first
  const sectionPermissions = [
    // Dashboard
    {
      code: "dashboard.section",
      label: "Dashboard",
      description: "Dashboard section",
      icon: "LayoutDashboard",
      module: "Dashboard",
      isSection: true,
      sequence: 1,
      showOnSidebar: true,
    },
    // User Management
    {
      code: "user.section",
      label: "User Management",
      description: "User management section",
      icon: "Users",
      module: "Users",
      isSection: true,
      sequence: 2,
      showOnSidebar: true,
    },
    // Role Management
    {
      code: "role.section",
      label: "Role Management",
      description: "Role management section",
      icon: "Shield",
      module: "Roles",
      isSection: true,
      sequence: 3,
      showOnSidebar: true,
    },
    // Permission Management
    {
      code: "permissions.section",
      label: "Permission Management",
      description: "Permission management section",
      icon: "Key",
      module: "Permissions",
      isSection: true,
      sequence: 4,
      showOnSidebar: true,
    },
    // Settings
    {
      code: "settings.section",
      label: "Settings",
      description: "Settings section",
      icon: "Settings",
      module: "Settings",
      isSection: true,
      sequence: 5,
      showOnSidebar: true,
    },
  ];

  // Create section permissions first
  await prisma.permission.createMany({
    data: sectionPermissions,
    skipDuplicates: true,
  });

  // Get section permissions to use their IDs as parentIds
  const sections = await prisma.permission.findMany({
    where: { isSection: true },
  });

  const sectionMap = new Map(sections.map((s) => [s.code, s.id]));

  // Child permissions with proper parentIds
  const childPermissions = [
    {
      code: "dashboard.view",
      label: "Overview",
      href: "/dashboard",
      description: "View dashboard overview",
      icon: "BarChart3",
      module: "dashboard",
      isSection: false,
      sequence: 1.1,
      parentId: sectionMap.get("dashboard.section"),
      showOnSidebar: true,
    },
    {
      code: "user.view",
      label: "Users",
      href: "/dashboard/users",
      description: "View users list",
      icon: "User",
      module: "user",
      isSection: false,
      sequence: 2.1,
      parentId: sectionMap.get("user.section"),
      showOnSidebar: true,
    },
    {
      code: "user.create",
      label: "Create User",
      description: "Create new user",
      module: "user",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "user.edit",
      label: "Edit User",
      description: "Edit existing user",
      module: "user",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "user.delete",
      label: "Delete User",
      description: "Delete user",
      module: "user",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "role.view",
      label: "Roles",
      href: "/dashboard/roles",
      description: "View roles list",
      icon: "ShieldCheck",
      module: "role",
      isSection: false,
      sequence: 3.1,
      parentId: sectionMap.get("role.section"),
      showOnSidebar: true,
    },
    {
      code: "role.create",
      label: "Create Role",
      description: "Create new role",
      module: "role",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "role.edit",
      label: "Edit Role",
      description: "Edit existing role",
      module: "role",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "role.delete",
      label: "Delete Role",
      description: "Delete role",
      module: "Roles",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "permissions.view",
      label: "Permissions",
      href: "/dashboard/permissions",
      description: "View permissions list",
      icon: "Key",
      module: "Permissions",
      isSection: false,
      sequence: 4.1,
      parentId: sectionMap.get("permissions.section"),
      showOnSidebar: true,
    },
    {
      code: "permissions.manage",
      label: "Manage Permissions",
      description: "Create, edit, and delete permissions",
      module: "Permissions",
      isSection: false,
      parentId: null,
      showOnSidebar: false,
    },
    {
      code: "settings.view",
      label: "General",
      href: "/dashboard/settings",
      description: "View general settings",
      icon: "Settings2",
      module: "Settings",
      isSection: false,
      sequence: 5.1,
      parentId: sectionMap.get("settings.section"),
      showOnSidebar: true,
    },
  ];

  // Role Permissions - will be created after we know the actual IDs
  const rolePermissionsConfig = [
    {
      roleName: "SUPERADMIN",
      permissionCodes: ["*"], // All permissions
    },
    {
      roleName: "ADMIN",
      permissionCodes: [
        "dashboard.section",
        "dashboard.view",
        "user.section",
        "user.view",
        "user.create",
        "user.edit",
        "user.delete",
        "role.section",
        "role.view",
        "permissions.section",
        "permissions.view",
        "permissions.manage",
        "settings.section",
        "settings.view",
      ],
    },
    {
      roleName: "USER",
      permissionCodes: ["dashboard.section", "dashboard.view"],
    },
  ];

  // ==================== SEED DATA ====================

  // Create Roles
  await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });
  console.log("✅ Roles created");

  // Create Users (hash passwords first)
  // First, fetch all roles to get their IDs
  const allRoles = await prisma.role.findMany();
  const roleMap = new Map(allRoles.map((r) => [r.name, r]));

  for (const user of users) {
    // Find role by name
    const role = roleMap.get(user.roleName);

    if (!role) {
      console.error(`❌ Role ${user.roleName} not found`);
      continue;
    }

    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        name: user.name,
        email: user.email,
        password: await bcrypt.hash(user.plainPassword, 10),
        roleId: role.id,
        status: true,
      },
    });
  }
  console.log("✅ Users created");

  // Create child permissions
  await prisma.permission.createMany({
    data: childPermissions,
    skipDuplicates: true,
  });
  console.log("✅ Permissions created");

  // Create Role Permissions
  // Fetch all permissions to avoid duplicate queries
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.code, p]));

  for (const config of rolePermissionsConfig) {
    // Find role by name
    const role = roleMap.get(config.roleName);

    if (!role) {
      console.error(`❌ Role ${config.roleName} not found`);
      continue;
    }

    if (config.permissionCodes.includes("*")) {
      // Superadmin gets all permissions
      for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    } else {
      // Other roles get specific permissions
      for (const code of config.permissionCodes) {
        const permission = permissionMap.get(code);

        if (!permission) {
          console.error(`❌ Permission ${code} not found`);
          continue;
        }

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }
  console.log("✅ Role permissions created");

  // ==================== CREDENTIALS ====================
  console.log("\n📋 Account Credentials:");
  console.log("─".repeat(50));
  console.log("🔑 SUPERADMIN - username: superadmin, password: super123");
  console.log("🔑 ADMIN      - username: admin, password: admin123");
  console.log("🔑 USER       - username: user, password: user123");
  console.log("─".repeat(50));
  console.log("✅ Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
