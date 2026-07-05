import { expect, test } from "@playwright/test";

test("loads live catalogue data and reaches phone verification", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Choose the moment. We handle the ritual." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /New job/ })).toBeVisible();

  await page.getByRole("button", { name: /New job/ }).click();
  await expect(page.getByText("Ritual details", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Raksha Kavach" })).toBeVisible();

  await page.getByRole("button", { name: /Choose time/ }).click();
  await expect(page.getByText("Choose time", { exact: true })).toBeVisible();
  await expect(page.locator(".slot-card").first()).toBeVisible();

  await page.getByRole("button", { name: /Verify phone/ }).click();
  await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Mobile number")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
