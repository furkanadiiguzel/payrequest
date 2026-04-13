import { type Page, type Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('signup-email-input');
    this.passwordInput = page.getByTestId('signup-password-input');
    this.submitButton = page.getByTestId('signup-submit-button');
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

  async signup(email: string, password: string) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    await this.page.waitForURL('/dashboard', { timeout: 15_000 });
  }

  async getError() {
    return this.errorMessage.textContent();
  }
}
