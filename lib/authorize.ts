import { getSession } from "@/lib/session";

export class UnauthorizedError extends Error {
  constructor(message = "You are not authorized to perform this operation") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Server actions call this first; throws so the client sees a clear error instead of silently failing.
export async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    throw new UnauthorizedError();
  }

  return session;
}
