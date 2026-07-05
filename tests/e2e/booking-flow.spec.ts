import { expect, test } from "@playwright/test";

test("loads live catalogue data and reaches phone verification without slot selection", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Choose the moment. We handle the ritual." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /New job/ })).toBeVisible();
  await expect(page.getByText(/Expected today|Performed by tomorrow/).first()).toBeVisible();

  await page.getByRole("button", { name: /New job/ }).click();
  await expect(page.getByText("Ritual details", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Raksha Kavach" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await expect(page.getByRole("button", { name: /Choose time/ })).toHaveCount(0);
  await expect(page.locator(".slot-card")).toHaveCount(0);
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Mobile number")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  expect(consoleErrors).toEqual([]);
});

test("keeps the fulfilment promise visible through payment, confirmation, and status", async ({
  page,
}) => {
  const rpcResponses: Record<string, unknown> = {
    request_mweb_otp: [
      {
        challenge_id: "11111111-1111-4111-8111-111111111111",
        phone: "+919000000707",
        dev_otp: "1234",
      },
    ],
    verify_mweb_otp: [
      {
        lead_id: "22222222-2222-4222-8222-222222222222",
        phone: "+919000000707",
        name: "Policy Test",
      },
    ],
    create_mweb_booking: [
      {
        booking_id: "33333333-3333-4333-8333-333333333333",
        booking_number: "SKTEST1",
      },
    ],
    mock_pay_mweb_booking: [
      {
        booking_id: "33333333-3333-4333-8333-333333333333",
        status: "pending_assignment",
      },
    ],
    get_mweb_booking: [
      {
        booking_id: "33333333-3333-4333-8333-333333333333",
        booking_number: "SKTEST1",
        ritual_title: "Raksha Kavach",
        use_case_title: "New job",
        preferred_date: "2026-07-06",
        preferred_time: "18:00:00",
        amount_minor: 25100,
        currency: "INR",
        status: "pending_assignment",
      },
    ],
  };

  await page.route("**/rest/v1/rpc/**", async (route) => {
    const rpcName = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    const body = rpcResponses[rpcName];
    if (!body) return route.continue();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /New job/ }).click();
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await page.getByLabel("Name").fill("Policy Test");
  await page.getByLabel("Mobile number").fill("9000000707");
  await page.getByRole("button", { name: /Send OTP/ }).click();
  await page.getByLabel("OTP").fill("1234");
  await page.getByRole("button", { name: /^Verify$/ }).click();

  await expect(page.getByText("Payment", { exact: true })).toBeVisible();
  await expect(page.getByText(/Expected today|Performed by tomorrow/).first()).toBeVisible();
  await page.getByRole("button", { name: /Mock pay/ }).click();

  await expect(page.getByText("Booking confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SKTEST1" })).toBeVisible();
  await expect(page.getByText(/Expected today|Performed by tomorrow/).first()).toBeVisible();
  await page.getByRole("button", { name: /Track status/ }).click();

  await expect(page.getByText("Booking status", { exact: true })).toBeVisible();
  await expect(page.getByText(/Expected today|Performed by tomorrow/).first()).toBeVisible();
});
