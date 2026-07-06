import type { Locator, Page } from "@playwright/test";

export class SankalpPage {
  constructor(readonly page: Page) {}

  get homeHeading() {
    return this.page.getByRole("heading", {
      name: "Choose the moment. We handle the ritual.",
    });
  }

  get phoneInput() {
    return this.page.getByLabel("Mobile number");
  }

  get nameInput() {
    return this.page.getByLabel("Name");
  }

  get otpInput() {
    return this.page.getByLabel("OTP");
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async startHeaderSignIn() {
    await this.page.getByRole("button", { name: /Sign in/ }).click();
  }

  async chooseRitual(name = "New job") {
    await this.page.getByRole("button", { name: new RegExp(name) }).click();
  }

  async continueBooking() {
    await this.page.getByRole("button", { name: /Continue booking/ }).click();
  }

  async requestOtp({ withName = false }: { withName?: boolean } = {}) {
    if (withName) await this.nameInput.fill("Policy Test");
    await this.phoneInput.fill("9000000707");
    await this.page.getByRole("button", { name: /Send OTP/ }).click();
  }

  async verifyOtp(code = "123456") {
    await this.otpInput.fill(code);
    await this.page.getByRole("button", { name: "Verify", exact: true }).click();
  }

  async completePhoneLogin({ withName = false }: { withName?: boolean } = {}) {
    await this.requestOtp({ withName });
    await this.verifyOtp();
  }

  bookingArticle(bookingNumber: string): Locator {
    return this.page.getByRole("article", { name: new RegExp(bookingNumber) });
  }

  async openBooking(bookingNumber: string) {
    await this.bookingArticle(bookingNumber).getByRole("button").first().click();
  }

  async openAccount() {
    await this.page.getByRole("button", { name: /account/ }).click();
  }
}
