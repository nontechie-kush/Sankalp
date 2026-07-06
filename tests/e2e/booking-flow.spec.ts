import { expect, test, type Page } from "@playwright/test";

const userId = "22222222-2222-4222-8222-222222222222";
const bookingId = "33333333-3333-4333-8333-333333333333";
const accessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDAwMDAwMDAwLCJzdWIiOiIyMjIyMjIyMi0yMjIyLTQyMjItODIyMi0yMjIyMjIyMjIyMjIiLCJwaG9uZSI6Iis5MTkwMDAwMDA3MDciLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.test-signature";

const profile = {
  user_id: userId,
  lead_id: "22222222-2222-4222-8222-222222222223",
  phone: "+919000000707",
  name: "Policy Test",
};

const booking = {
  booking_id: bookingId,
  booking_number: "SKTEST1",
  ritual_title: "Raksha Kavach",
  use_case_title: "New job",
  preferred_date: "2026-07-06",
  preferred_time: "18:00:00",
  promised_service_date: "2026-07-06",
  promised_by: "2026-07-06T18:29:59Z",
  amount_minor: 25100,
  currency: "INR",
  status: "pending_assignment",
  payment_status: "paid",
  created_at: "2026-07-06T08:00:00Z",
  updated_at: "2026-07-06T08:01:00Z",
};

const secondActiveBooking = {
  ...booking,
  booking_id: "55555555-5555-4555-8555-555555555555",
  booking_number: "SKTEST2",
  ritual_title: "Nazar Badha",
  use_case_title: "Feeling off lately",
  status: "ritual_scheduled",
};

async function installCatalogueMocks(page: Page) {
  const catalogue: Record<string, unknown[]> = {
    rituals: [
      {
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        slug: "examBlessings",
        title: "Raksha Kavach",
        subtitle: "Protection shield",
        short_description: "Protect your focus before an important moment.",
        description: "A focused blessing.",
        duration_minutes: 30,
        starting_price_minor: 25100,
        currency: "INR",
      },
    ],
    mweb_home_banners: [
      {
        id: "3898eba7-f281-444b-812a-06ed19966382",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        badge: "RAKSHA KAVACH",
        title: "Big exam or interview coming up?",
        subtitle: "Book a verified pandit.",
        visual_tone: "clay",
      },
    ],
    mweb_ritual_use_cases: [
      {
        id: "c38119f9-75e4-4855-8a1e-55cce96fc324",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        group_label: "Career & money",
        icon_name: "briefcase",
        title: "New job",
        subtitle: "Start the new chapter protected",
        price_minor: 25100,
        currency: "INR",
        is_popular: false,
      },
    ],
    mweb_time_slots: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        slot_date: "2026-07-06",
        slot_time: "18:00:00",
        label: "Evening",
        is_auspicious: false,
      },
    ],
    faqs: [],
  };

  for (const [table, body] of Object.entries(catalogue)) {
    await page.route(`**/rest/v1/${table}*`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
  }
}

async function installMemberMocks(page: Page, initialBookings: (typeof booking)[] = []) {
  await installCatalogueMocks(page);
  let storedBookings = [...initialBookings];

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
          id: userId,
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

  await page.route("**/auth/v1/logout**", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/rest/v1/rpc/**", async (route) => {
    const rpcName = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    let body: unknown;
    if (rpcName === "get_my_mweb_profile") body = [profile];
    else if (rpcName === "upsert_mweb_authenticated_lead") body = [profile];
    else if (rpcName === "list_my_mweb_bookings") body = storedBookings;
    else if (rpcName === "create_my_mweb_booking") {
      if (!storedBookings.some((item) => item.booking_id === bookingId)) {
        storedBookings = [booking, ...storedBookings];
      }
      body = [{ booking_id: bookingId, booking_number: booking.booking_number }];
    } else if (rpcName === "pay_my_mweb_booking") {
      body = [{ booking_id: bookingId, status: booking.status, payment_status: "paid" }];
    } else if (rpcName === "get_my_mweb_booking") {
      const requestedId = (route.request().postDataJSON() as { p_booking_id?: string }).p_booking_id;
      body = storedBookings.filter((item) => item.booking_id === requestedId);
    }
    else return route.continue();

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

async function completePhoneLogin(page: Page, withName = false) {
  if (withName) await page.getByLabel("Name").fill("Policy Test");
  await page.getByLabel("Mobile number").fill("9000000707");
  await page.getByRole("button", { name: /Send OTP/ }).click();
  await expect(page.getByText("We sent a 6-digit code")).toBeVisible();
  await page.getByLabel("OTP").fill("123456");
  await page.getByRole("button", { name: /^Verify$/ }).click();
}

test("guest can browse and reaches phone verification without slot selection", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await installCatalogueMocks(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Sign in/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Choose the moment. We handle the ritual." }),
  ).toBeVisible();

  await page.getByRole("button", { name: /New job/ }).click();
  await expect(page).toHaveURL(/\/ritual\//);
  await expect(page.getByText("Ritual details", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Choose time/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await expect(page).toHaveURL(/\/auth\/phone$/);
  await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("guest booking creates a member session and reaches server-backed status", async ({ page }) => {
  await installMemberMocks(page);
  await page.goto("/");
  await page.getByRole("button", { name: /New job/ }).click();
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await completePhoneLogin(page, true);

  await expect(page).toHaveURL(/\/checkout\/payment$/);
  await expect(page.getByText("Payment", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Confirm booking/ }).click();

  await expect(page).toHaveURL(new RegExp(`/booking-confirmed/${bookingId}$`));
  await expect(page.getByText("Booking confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SKTEST1" })).toBeVisible();
  await page.getByRole("button", { name: /Track status/ }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${bookingId}$`));
  await expect(page.getByText("Finding your pandit", { exact: true }).first()).toBeVisible();
});

test("refreshing an unverified OTP screen safely returns to phone entry", async ({ page }) => {
  await installMemberMocks(page);
  await page.goto("/");
  await page.getByRole("button", { name: /New job/ }).click();
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await page.getByLabel("Name").fill("Policy Test");
  await page.getByLabel("Mobile number").fill("9000000707");
  await page.getByRole("button", { name: /Send OTP/ }).click();
  await expect(page).toHaveURL(/\/auth\/otp$/);

  await page.reload();
  await expect(page).toHaveURL(/\/auth\/phone$/);
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByText(/Booking New job/)).toBeVisible();
});

test("returning member restores bookings after refresh and skips OTP on a new booking", async ({ page }) => {
  await installMemberMocks(page, [booking]);
  await page.goto("/");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await completePhoneLogin(page);

  await expect(page).toHaveURL(/\/bookings$/);
  await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByText("SKTEST1")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByText("SKTEST1")).toBeVisible();

  await page.getByRole("button", { name: "Sankalp home" }).click();
  await page.getByRole("button", { name: /New job/ }).click();
  await page.getByRole("button", { name: /Continue booking/ }).click();
  await expect(page).toHaveURL(/\/checkout\/payment$/);
  await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toHaveCount(0);
});

test("member can sign out locally and returns to guest state", async ({ page }) => {
  await installMemberMocks(page, [booking]);
  await page.goto("/");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await completePhoneLogin(page);
  await page.getByRole("button", { name: /Policy account/ }).click();
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  await page.getByRole("button", { name: /Sign out on this device/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Sign in/ })).toBeVisible();
});

test("multiple active bookings use My Bookings navigation", async ({ page }) => {
  await installMemberMocks(page, [booking, secondActiveBooking]);
  await page.goto("/");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await completePhoneLogin(page);

  await expect(page.getByRole("button", { name: /^My bookings$/i })).toBeVisible();
  await expect(page.locator(".booking-list-card")).toHaveCount(2);
  await expect(page.getByText("SKTEST1")).toBeVisible();
  await expect(page.getByText("SKTEST2")).toBeVisible();
});
