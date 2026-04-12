import { type Page, type Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('signup-email');
    this.passwordInput = page.getByTestId('signup-password');
    this.submitButton = page.getByTestId('signup-submit');
    this.errorMessage = page.getByTestId('signup-error');
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getError() {
    return this.errorMessage.textContent();
  }
}
