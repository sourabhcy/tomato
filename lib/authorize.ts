import { getSession } from "@/lib/session";
import { hasPermission, type Permission } from "@/lib/rbac";

export class UnauthorizedError extends Error {
  constructor(message = "You are not authorized to perform this operation") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Server actions call this first; throws so the client sees a clear error instead of silently failing.
export async function requirePermission(permission: Permission) {
  const session = await getSession();

  if (!hasPermission(session?.role, permission)) {
    throw new UnauthorizedError();
  }

  return session!;
}

// Permission-gated pages call this instead; returns null so the page can render an Unauthorized view.
export async function getSessionWithPermission(permission: Permission) {
  const session = await getSession();

  return hasPermission(session?.role, permission) ? session : null;
}

