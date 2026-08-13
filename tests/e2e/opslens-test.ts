import { expect, test as base } from "@playwright/test";

const opslensUrl = process.env.OPSLENS_E2E_BASE_URL ?? "http://127.0.0.1:3002";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(`${opslensUrl}/login`);
    await page.getByLabel("Email").fill("admin@opslens.local");
    await page.getByLabel("Password").fill("opslens1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await use(page);
  }
});

export { expect };
