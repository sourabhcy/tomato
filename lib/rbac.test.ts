import { hasPermission, getRequiredPermission, canView, canManage } from "./rbac";

describe("rbac", () => {
  describe("hasPermission", () => {
    it("grants admin-only permissions to the admin role", () => {
      expect(hasPermission("admin", "admin:view")).toBe(true);
      expect(hasPermission("admin", "users:manage")).toBe(true);
      expect(hasPermission("admin", "products:manage")).toBe(true);
    });

    it("denies admin-only permissions to the user role", () => {
      expect(hasPermission("user", "admin:view")).toBe(false);
      expect(hasPermission("user", "users:manage")).toBe(false);
      expect(hasPermission("user", "products:manage")).toBe(false);
    });

    it("denies permissions for a missing or unknown role", () => {
      expect(hasPermission(null, "admin:view")).toBe(false);
      expect(hasPermission(undefined, "admin:view")).toBe(false);
      expect(hasPermission("superadmin", "admin:view")).toBe(false);
    });
  });

  describe("canView / canManage", () => {
    it("grants both view and manage on a resource the admin role has manage on", () => {
      expect(canView("admin", "users")).toBe(true);
      expect(canManage("admin", "users")).toBe(true);
    });

    it("denies both view and manage for a role with no permissions on the resource", () => {
      expect(canView("user", "users")).toBe(false);
      expect(canManage("user", "users")).toBe(false);
    });

    it("view and manage are independent checks per resource", () => {
      // Demonstrates the architecture supports a view-only role without any code
      // changes elsewhere - only ROLE_PERMISSIONS would need a new entry.
      expect(canView("admin", "products")).toBe(true);
      expect(canManage("admin", "products")).toBe(true);
      expect(canView("user", "products")).toBe(false);
      expect(canManage("user", "products")).toBe(false);
    });
  });

  describe("getRequiredPermission", () => {
    it("requires admin:view for /admin routes", () => {
      expect(getRequiredPermission("/admin/users")).toBe("admin:view");
      expect(getRequiredPermission("/admin/settings")).toBe("admin:view");
      expect(getRequiredPermission("/admin")).toBe("admin:view");
    });

    it("requires no permission for unprotected routes", () => {
      expect(getRequiredPermission("/products")).toBeNull();
      expect(getRequiredPermission("/cart")).toBeNull();
    });
  });
});
