import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

test.describe("role based access control", () => {
  test("non-admin users are redirected away from admin pages", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("admin can view the users page and create a sub user", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/products$/);

    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    const email = `subuser-${Date.now()}@example.com`;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input').first().fill("Sub User");
    await page.locator('input[type="password"]').fill("subpassword123");
    await page.getByRole("button", { name: "Create user" }).click();

    await expect(page.getByText(email)).toBeVisible();
  });

  test("sub users cannot access the configuration page", async ({ page, context }) => {
    // Log in as admin to create a sub user for this test, then switch identity.
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/users");

    const email = `subuser-${Date.now()}@example.com`;
    const password = "subpassword123";
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input').first().fill("Sub User");
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page.getByText(email)).toBeVisible();

    await context.clearCookies();
    await login(page, email, password);
    await expect(page).toHaveURL(/\/products$/);

    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);

    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByText("You are not authorized to perform this operation.")).toBeVisible();
  });
});
