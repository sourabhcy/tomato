// Central RBAC registry. To add a new capability: add the Resource/Action (or
// grant an existing Permission to a role) below - no other file needs an if/else.
//
// Permissions are `${Resource}:${Action}` pairs so view and write access can be
// granted independently per resource (e.g. a role can see the admin area and
// the user list, "view", without being able to create/delete users, "manage").

export type Role = "admin" | "user";
export type Resource = "admin" | "users" | "products";
export type Action = "view" | "manage";
export type Permission = `${Resource}:${Action}`;

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ["admin:view", "users:view", "users:manage", "products:view", "products:manage"],
  user: [],
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return false;
  }

  return ROLE_PERMISSIONS[role as Role].includes(permission);
}

// Convenience wrappers for the common view/manage split - reads better at call sites
// than hasPermission(role, `${resource}:view`) and keeps the template literal in one place.
export const canView = (role: string | null | undefined, resource: Resource) =>
  hasPermission(role, `${resource}:view`);
export const canManage = (role: string | null | undefined, resource: Resource) =>
  hasPermission(role, `${resource}:manage`);

// Route-level gates consumed by proxy.ts, checked against the *view* permission only -
// a route being reachable is separate from which actions within it are allowed.
// Add an entry here to protect a new route prefix.
export const PROTECTED_ROUTES: readonly { matcher: RegExp; permission: Permission }[] = [
  { matcher: /^\/admin(\/|$)/, permission: "admin:view" },
];

export function getRequiredPermission(pathname: string): Permission | null {
  return PROTECTED_ROUTES.find(({ matcher }) => matcher.test(pathname))?.permission ?? null;
}
