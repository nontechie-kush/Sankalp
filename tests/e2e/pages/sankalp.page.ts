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

  async requestOtp() {
    await this.phoneInput.fill("9000000707");
    await this.page.getByRole("button", { name: /Send OTP/ }).click();
  }

  async verifyOtp(code = "123456") {
    await this.otpInput.fill(code);
    await this.page.getByRole("button", { name: "Verify", exact: true }).click();
  }

  async completePhoneLogin() {
    await this.requestOtp();
    await this.verifyOtp();
  }

  async completeFirstTimeProfile({
    name = "Policy Test",
    birthDate,
    birthPlace,
  }: {
    name?: string;
    birthDate?: string;
    birthPlace?: string;
  } = {}) {
    await this.page.getByLabel("Full name").fill(name);
    await this.page.getByRole("button", { name: "Continue", exact: true }).click();

    if (birthDate) {
      await this.page.getByLabel(/Date of birth/).fill(birthDate);
      await this.page.getByRole("button", { name: /Save and continue/ }).click();
    } else {
      await this.page.getByRole("button", { name: /Skip for now/ }).click();
    }

    if (birthPlace) {
      await this.page.getByLabel(/Place of birth/).fill(birthPlace);
      await this.page.getByRole("button", { name: /Save profile/ }).click();
    } else {
      await this.page.getByRole("button", { name: /Skip for now/ }).click();
    }
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
