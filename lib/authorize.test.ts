import { requirePermission, getSessionWithPermission } from "./authorize";
import { getSession } from "@/lib/session";

jest.mock("@/lib/session", () => ({ getSession: jest.fn() }));

const mockGetSession = jest.mocked(getSession);

describe("authorize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requirePermission", () => {
    it("throws when there is no session", async () => {
      mockGetSession.mockResolvedValue(null);

      await expect(requirePermission("admin:view")).rejects.toThrow("not authorized");
    });

    it("throws when the session's role lacks the permission", async () => {
      mockGetSession.mockResolvedValue({ userId: 1, role: "user" });

      await expect(requirePermission("users:manage")).rejects.toThrow("not authorized");
    });

    it("returns the session when the role has the permission", async () => {
      const session = { userId: 1, role: "admin" };
      mockGetSession.mockResolvedValue(session);

      await expect(requirePermission("users:manage")).resolves.toEqual(session);
    });
  });

  describe("getSessionWithPermission", () => {
    it("returns null when there is no session", async () => {
      mockGetSession.mockResolvedValue(null);

      await expect(getSessionWithPermission("admin:view")).resolves.toBeNull();
    });

    it("returns null when the session's role lacks the permission", async () => {
      mockGetSession.mockResolvedValue({ userId: 1, role: "user" });

      await expect(getSessionWithPermission("admin:view")).resolves.toBeNull();
    });

    it("returns the session when the role has the permission", async () => {
      const session = { userId: 1, role: "admin" };
      mockGetSession.mockResolvedValue(session);

      await expect(getSessionWithPermission("admin:view")).resolves.toEqual(session);
    });
  });
});
