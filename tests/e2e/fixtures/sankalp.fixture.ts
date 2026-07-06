import { test as base, expect, type Page } from "@playwright/test";
import type { Booking } from "../../../src/types";
import { SankalpPage } from "../pages/sankalp.page";

export const userId = "22222222-2222-4222-8222-222222222222";
export const bookingId = "33333333-3333-4333-8333-333333333333";

const accessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDAwMDAwMDAwLCJzdWIiOiIyMjIyMjIyMi0yMjIyLTQyMjItODIyMi0yMjIyMjIyMjIyMjIiLCJwaG9uZSI6Iis5MTkwMDAwMDA3MDciLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.test-signature";

export const profile = {
  user_id: userId,
  lead_id: "22222222-2222-4222-8222-222222222223",
  phone: "+919000000707",
  name: "Policy Test",
};

export const booking: Booking = {
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

export const secondActiveBooking: Booking = {
  ...booking,
  booking_id: "55555555-5555-4555-8555-555555555555",
  booking_number: "SKTEST2",
  ritual_title: "Nazar Badha",
  use_case_title: "Feeling off lately",
  status: "ritual_scheduled",
};

export const cancelledBooking: Booking = {
  ...booking,
  booking_id: "66666666-6666-4666-8666-666666666666",
  booking_number: "SKCANCEL",
  status: "cancelled",
  payment_status: "cancelled",
};

export const pendingPaymentBooking: Booking = {
  ...booking,
  booking_id: "77777777-7777-4777-8777-777777777777",
  booking_number: "SKPAY",
  status: "pending_payment",
  payment_status: "pending",
};

export class SankalpMockApi {
  private storedBookings: Booking[] = [];
  private listFailure = false;
  private otpFailure = false;

  constructor(private readonly page: Page) {}

  seedBookings(bookings: Booking[]) {
    this.storedBookings = bookings.map((item) => ({ ...item }));
  }

  failBookingList() {
    this.listFailure = true;
  }

  failOtpVerification() {
    this.otpFailure = true;
  }

  async install() {
    await this.installCatalogue();

    await this.page.route("**/auth/v1/otp", async (route) => {
      await route.fulfill({ status: 200, json: {} });
    });

    await this.page.route("**/auth/v1/verify", async (route) => {
      if (this.otpFailure) {
        await route.fulfill({ status: 400, json: { message: "Token has expired or is invalid" } });
        return;
      }

      const now = new Date().toISOString();
      await route.fulfill({
        status: 200,
        json: {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "test-refresh-token",
          user: {
            id: userId,
            aud: "authenticated",
            role: "authenticated",
            phone: profile.phone,
            phone_confirmed_at: now,
            user_metadata: { full_name: profile.name },
            app_metadata: { provider: "phone", providers: ["phone"] },
            identities: [],
            created_at: now,
            updated_at: now,
          },
        },
      });
    });

    await this.page.route("**/auth/v1/logout**", async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });

    await this.page.route("**/rest/v1/rpc/**", async (route) => {
      const rpcName = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
      let body: unknown;

      if (rpcName === "get_my_mweb_profile") body = [profile];
      else if (rpcName === "upsert_mweb_authenticated_lead") body = [profile];
      else if (rpcName === "list_my_mweb_bookings") {
        if (this.listFailure) {
          await route.fulfill({ status: 500, json: { message: "Booking service unavailable" } });
          return;
        }
        body = this.storedBookings;
      } else if (rpcName === "create_my_mweb_booking") {
        if (!this.storedBookings.some((item) => item.booking_id === bookingId)) {
          this.storedBookings = [booking, ...this.storedBookings];
        }
        body = [{ booking_id: bookingId, booking_number: booking.booking_number }];
      } else if (rpcName === "pay_my_mweb_booking") {
        const requestedId = (route.request().postDataJSON() as { p_booking_id?: string }).p_booking_id;
        this.storedBookings = this.storedBookings.map((item) =>
          item.booking_id === requestedId
            ? { ...item, status: "pending_assignment", payment_status: "paid" }
            : item,
        );
        const paid = this.storedBookings.find((item) => item.booking_id === requestedId);
        body = [{
          booking_id: requestedId,
          status: paid?.status ?? "pending_assignment",
          payment_status: paid?.payment_status ?? "paid",
        }];
      } else if (rpcName === "get_my_mweb_booking") {
        const requestedId = (route.request().postDataJSON() as { p_booking_id?: string }).p_booking_id;
        body = this.storedBookings.filter((item) => item.booking_id === requestedId);
      } else {
        await route.continue();
        return;
      }

      await route.fulfill({ status: 200, json: body });
    });
  }

  private async installCatalogue() {
    const catalogue: Record<string, unknown[]> = {
      rituals: [{
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        slug: "examBlessings",
        title: "Raksha Kavach",
        subtitle: "Protection shield",
        short_description: "Protect your focus before an important moment.",
        description: "A focused blessing.",
        duration_minutes: 30,
        starting_price_minor: 25100,
        currency: "INR",
      }],
      mweb_home_banners: [{
        id: "3898eba7-f281-444b-812a-06ed19966382",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        badge: "RAKSHA KAVACH",
        title: "Big exam or interview coming up?",
        subtitle: "Book a verified pandit.",
        visual_tone: "clay",
      }],
      mweb_ritual_use_cases: [{
        id: "c38119f9-75e4-4855-8a1e-55cce96fc324",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        group_label: "Career & money",
        icon_name: "briefcase",
        title: "New job",
        subtitle: "Start the new chapter protected",
        price_minor: 25100,
        currency: "INR",
        is_popular: false,
      }],
      mweb_time_slots: [{
        id: "44444444-4444-4444-8444-444444444444",
        ritual_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        slot_date: "2026-07-06",
        slot_time: "18:00:00",
        label: "Evening",
        is_auspicious: false,
      }],
      faqs: [],
    };

    for (const [table, body] of Object.entries(catalogue)) {
      await this.page.route(`**/rest/v1/${table}*`, async (route) => {
        await route.fulfill({ status: 200, json: body });
      });
    }
  }
}

interface SankalpFixtures {
  mockApi: SankalpMockApi;
  sankalp: SankalpPage;
}

export const test = base.extend<SankalpFixtures>({
  mockApi: async ({ page }, use) => {
    const mockApi = new SankalpMockApi(page);
    await mockApi.install();
    await use(mockApi);
  },
  sankalp: async ({ page, mockApi }, use) => {
    void mockApi;
    await use(new SankalpPage(page));
  },
});

export { expect };
