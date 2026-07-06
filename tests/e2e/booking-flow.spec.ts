import {
  booking,
  bookingId,
  cancelledBooking,
  expect,
  pendingPaymentBooking,
  secondActiveBooking,
  test,
} from "./fixtures/sankalp.fixture";

test("guest booking creates a member session and reaches server-backed status", async ({
  page,
  sankalp,
}) => {
  await test.step("select a ritual without choosing a time", async () => {
    await sankalp.goto();
    await expect(page.getByRole("button", { name: /Sign in/ })).toBeVisible();
    await expect(sankalp.homeHeading).toBeVisible();

    await sankalp.chooseRitual();
    await expect(page).toHaveURL(/\/ritual\//);
    await expect(page.getByText("Ritual details", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Choose time/ })).toHaveCount(0);
    await sankalp.continueBooking();
    await expect(page).toHaveURL(/\/auth\/phone$/);
  });

  await test.step("verify the phone and create the account", async () => {
    await sankalp.completePhoneLogin({ withName: true });
    await expect(page).toHaveURL(/\/checkout\/payment$/);
    await expect(page.getByText("Payment", { exact: true })).toBeVisible();
  });

  await test.step("confirm and track the server-backed booking", async () => {
    await page.getByRole("button", { name: /Confirm booking/ }).click();
    await expect(page).toHaveURL(new RegExp(`/booking-confirmed/${bookingId}$`));
    await expect(page.getByText("Booking confirmed", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "SKTEST1" })).toBeVisible();

    await page.getByRole("button", { name: /Track status/ }).click();
    await expect(page).toHaveURL(new RegExp(`/bookings/${bookingId}$`));
    await expect(page.getByText("Finding your pandit", { exact: true }).first()).toBeVisible();
  });
});

test("refreshing an unverified OTP screen safely returns to phone entry", async ({
  page,
  sankalp,
}) => {
  await sankalp.goto();
  await sankalp.chooseRitual();
  await sankalp.continueBooking();
  await sankalp.requestOtp({ withName: true });
  await expect(page).toHaveURL(/\/auth\/otp$/);

  await page.reload();

  await expect(page).toHaveURL(/\/auth\/phone$/);
  await expect(sankalp.nameInput).toBeVisible();
  await expect(page.getByText(/Booking New job/)).toBeVisible();
});

test("returning member restores bookings after refresh and skips OTP", async ({
  page,
  sankalp,
  mockApi,
}) => {
  mockApi.seedBookings([booking]);

  await test.step("sign in and restore the booking list", async () => {
    await sankalp.goto();
    await sankalp.startHeaderSignIn();
    await sankalp.completePhoneLogin();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
    await expect(page.getByText("SKTEST1")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
    await expect(page.getByText("SKTEST1")).toBeVisible();
  });

  await test.step("start another booking without a second OTP", async () => {
    await page.getByRole("button", { name: "Sankalp home" }).click();
    await sankalp.chooseRitual();
    await sankalp.continueBooking();
    await expect(page).toHaveURL(/\/checkout\/payment$/);
    await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toHaveCount(0);
  });
});

test("member can sign out locally", async ({ page, sankalp, mockApi }) => {
  mockApi.seedBookings([booking]);
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.completePhoneLogin();

  await sankalp.openAccount();
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  await page.getByRole("button", { name: /Sign out on this device/ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Sign in/ })).toBeVisible();
});

test("multiple active bookings use My Bookings navigation", async ({
  page,
  sankalp,
  mockApi,
}) => {
  mockApi.seedBookings([booking, secondActiveBooking]);
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.completePhoneLogin();

  await expect(page.getByRole("button", { name: /^My bookings$/i })).toBeVisible();
  const activeBookings = page.getByRole("region", { name: "Active bookings" });
  await expect(activeBookings.getByRole("article")).toHaveCount(2);
  await expect(activeBookings.getByText("SKTEST1")).toBeVisible();
  await expect(activeBookings.getByText("SKTEST2")).toBeVisible();
});

test("guest opening protected bookings route is redirected to sign in", async ({
  page,
  sankalp,
}) => {
  await sankalp.goto("/bookings");

  await expect(page).toHaveURL(/\/auth\/phone$/);
  await expect(page.getByRole("heading", { name: "Where should we send the OTP?" })).toBeVisible();
  await expect(sankalp.nameInput).toHaveCount(0);
});

test("invalid OTP displays an actionable error", async ({ page, sankalp, mockApi }) => {
  mockApi.failOtpVerification();
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.requestOtp();
  await sankalp.verifyOtp("000000");

  await expect(page).toHaveURL(/\/auth\/otp$/);
  await expect(page.getByRole("alert")).toContainText(/expired|incorrect/i);
});

test("booking list service failure renders a retryable error", async ({
  page,
  sankalp,
  mockApi,
}) => {
  mockApi.failBookingList();
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.completePhoneLogin();

  await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Booking service unavailable");
  await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeVisible();
});

test("cancelled booking renders cancellation state without active timeline", async ({
  page,
  sankalp,
  mockApi,
}) => {
  mockApi.seedBookings([cancelledBooking]);
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.completePhoneLogin();
  await sankalp.openBooking("SKCANCEL");

  await expect(page.getByRole("heading", { name: "Booking cancelled" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Booking progress" })).toHaveCount(0);
});

test("pending payment can be resumed idempotently", async ({ page, sankalp, mockApi }) => {
  mockApi.seedBookings([pendingPaymentBooking]);
  await sankalp.goto();
  await sankalp.startHeaderSignIn();
  await sankalp.completePhoneLogin();

  const pendingBooking = sankalp.bookingArticle("SKPAY");
  await pendingBooking.getByRole("button", { name: "Resume payment" }).click();

  await expect(page).toHaveURL(new RegExp(`/bookings/${pendingPaymentBooking.booking_id}$`));
  await expect(page.getByText(/Current status: Finding your pandit/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume payment" })).toHaveCount(0);
});
