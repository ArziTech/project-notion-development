# Permission System Documentation

This project includes a comprehensive permission-based access control system with client-side and server-side components.

## Features

- **Role-based permissions**: Users have roles, and roles have permissions
- **Client-side permission checking**: `usePermission` hook for UI access control
- **Declarative permission gates**: `PermissionGate` component for protecting UI elements
- **Superadmin bypass**: `byPassAllFeatures` flag for superadmin roles
- **React Query caching**: 5-minute cache for permission data
- **Loading states**: Skeleton states while permissions load

## Components

### PermissionGate

Wrap any UI element with `PermissionGate` to conditionally render it based on user permissions.

```tsx
import { PermissionGate } from "@/components/auth/permission-gate";

// Single permission check
<PermissionGate permission="users.view">
  <button>View Users</button>
</PermissionGate>

// Multiple permissions (any match)
<PermissionGate permissions={["users.view", "admin.access"]}>
  <button>Admin Panel</button>
</PermissionGate>

// Multiple permissions (all required)
<PermissionGate permissions={["users.view", "users.create"]} requireAll={true}>
  <button>Create User</button>
</PermissionGate>

// With fallback
<PermissionGate permission="users.delete" fallback={<div>Access Denied</div>}>
  <button>Delete User</button>
</PermissionGate>
```

### usePermission Hook

Access permission checking functions in your components.

```tsx
import { usePermission } from "@/hooks/use-permission";

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, byPassAllFeatures, isLoading } = usePermission();

  if (isLoading) return <Skeleton />;

  if (hasPermission("users.view")) {
    // Show users
  }

  if (hasAnyPermission(["users.view", "users.edit"])) {
    // Show either view or edit options
  }

  if (hasAllPermissions(["users.create", "users.edit"])) {
    // Show full CRUD options
  }
}
```

## API Endpoints

### GET /api/permissions/me

Returns the current user's permissions.

**Response:**
```json
{
  "permissions": [
    {
      "id": 1,
      "code": "users.view",
      "label": "View Users",
      "href": "/users",
      "icon": "Users",
      "module": "Users",
      "isSection": false,
      "sequence": 1,
      "isActive": true
    }
  ],
  "byPassAllFeatures": false
}
```

## Database Schema

### Role Model
- `byPassAllFeatures`: When true, user has access to all permissions
- `isActive`: Whether the role is active

### Permission Model
- `code`: Unique permission code (e.g., "users.view")
- `label`: Human-readable label (e.g., "View Users")
- `href`: Optional URL for navigation
- `icon`: Optional icon name for UI
- `module`: Module/category for grouping
- `isSection`: Whether this is a section header in menu
- `showOnSidebar`: Whether to show in sidebar menu
- `isActive`: Whether the permission is active

### RolePermission Model (Junction)
- Links roles to permissions

## Common Permission Codes

Suggested permission code patterns:
- `{resource}.view` - View resource
- `{resource}.create` - Create new resource
- `{resource}.update` - Edit existing resource
- `{resource}.delete` - Delete resource
- `{resource}.export` - Export resource data
- `{resource}.import` - Import resource data
- `admin.access` - Admin panel access
- `settings.view` - View settings
- `settings.manage` - Modify settings

## Testing with Different Roles

1. **Superadmin** (byPassAllFeatures: true):
   - Has access to all permissions
   - PermissionGate always renders children

2. **Regular Role**:
   - Only sees permitted UI elements
   - PermissionGate filters based on assigned permissions

## Security Notes

⚠️ **Important**: PermissionGate is UI-only protection

- Client-side checks can be bypassed
- **Always** validate permissions on the server for:
  - API routes
  - Database mutations
  - Sensitive operations
- Use `byPassAllFeatures` check on server-side too

Example server-side check:
```typescript
// In API route
const role = await prisma.role.findUnique({
  where: { id: session.user.roleId },
  select: { byPassAllFeatures: true }
});

if (role?.byPassAllFeatures) {
  // Allow operation
} else {
  // Check specific permission
  const hasPermission = await checkUserPermission(session.user.id, "users.create");
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

## Examples

See the following files for complete examples:
- `/src/app/(dashboard)/dashboard/page.tsx` - Dashboard with permission gate
- `/src/app/(dashboard)/users/page.tsx` - User management with CRUD permissions
- `/src/app/(dashboard)/permissions/page.tsx` - Permission management examples
