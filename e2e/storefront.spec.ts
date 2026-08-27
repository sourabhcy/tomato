import { expect, test } from "@playwright/test";

test.describe("storefront navigation", () => {
  test("redirects visitors from the home page to login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("shows the login form with required credentials", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toHaveAttribute("required", "");
    await expect(page.locator('input[type="password"]')).toHaveAttribute("required", "");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("explains that the cart requires authentication", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByText("Please log in to view your cart.")).toBeVisible();
  });
});