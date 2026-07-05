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
  await expect(page.locator(".service-promise")).toHaveCount(0);

  await page.getByRole("button", { name: /New job/ }).click();
  await expect(page.getByText("Ritual details", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Raksha Kavach" })).toBeVisible();
  await expect(page.getByText(/Expected today|Performed by tomorrow/).first()).toBeVisible();
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
  const accessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDAwMDAwMDAwLCJzdWIiOiIyMjIyMjIyMi0yMjIyLTQyMjItODIyMi0yMjIyMjIyMjIyMjIiLCJwaG9uZSI6Iis5MTkwMDAwMDA3MDciLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.test-signature";
  const rpcResponses: Record<string, unknown> = {
    upsert_mweb_authenticated_lead: [
      {
        lead_id: "22222222-2222-4222-8222-222222222222",
        phone: "+919000000707",
        name: "Policy Test",
      },
    ],
    create_authenticated_mweb_booking: [
      {
        booking_id: "33333333-3333-4333-8333-333333333333",
        booking_number: "SKTEST1",
      },
    ],
    mock_pay_authenticated_mweb_booking: [
      {
        booking_id: "33333333-3333-4333-8333-333333333333",
        status: "pending_assignment",
      },
    ],
    get_authenticated_mweb_booking: [
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

  await page.route("**/auth/v1/otp", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/auth/v1/verify", async (route) => {
    const now = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test-refresh-token",
        user: {
          id: "22222222-2222-4222-8222-222222222222",
          aud: "authenticated",
          role: "authenticated",
          phone: "+919000000707",
          phone_confirmed_at: now,
          user_metadata: { full_name: "Policy Test" },
          app_metadata: { provider: "phone", providers: ["phone"] },
          identities: [],
          created_at: now,
          updated_at: now,
        },
      }),
    });
  });

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
  await expect(page.getByText("We sent a 6-digit code")).toBeVisible();
  await expect(page.getByRole("button", { name: /Resend OTP in/ })).toBeDisabled();
  await page.getByLabel("OTP").fill("123456");
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
