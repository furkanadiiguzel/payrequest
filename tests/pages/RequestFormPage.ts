import { type Page, type Locator } from '@playwright/test';

export class RequestFormPage {
  readonly page: Page;
  readonly recipientInput: Locator;
  readonly amountInput: Locator;
  readonly noteInput: Locator;
  readonly submitButton: Locator;
  readonly successScreen: Locator;
  readonly shareableLink: Locator;
  readonly copyLinkButton: Locator;
  readonly goToDashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipientInput = page.getByTestId('request-recipient-input');
    this.amountInput = page.getByTestId('request-amount-input');
    this.noteInput = page.getByTestId('request-note-input');
    this.submitButton = page.getByTestId('request-submit-button');
    this.successScreen = page.getByTestId('success-screen');
    this.shareableLink = page.getByTestId('shareable-link');
    this.copyLinkButton = page.getByTestId('copy-link-btn');
    this.goToDashboardButton = page.getByTestId('go-to-dashboard-btn');
  }

  async goto() {
    await this.page.goto('/request/new');
    await this.recipientInput.waitFor();
  }

  async fillRecipient(value: string) {
    await this.recipientInput.fill(value);
  }

  async fillAmount(value: string) {
    await this.amountInput.click();
    await this.amountInput.fill(value);
    await this.amountInput.blur();   // triggers the 2-decimal formatter
  }

  async fillNote(value: string) {
    await this.noteInput.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForSuccessScreen() {
    await this.successScreen.waitFor({ timeout: 15_000 });
  }

  async getFieldError(field: 'recipient' | 'amount' | 'note') {
    return this.page.getByTestId(`${field}-error`).textContent();
  }

  async getShareableLink() {
    return this.shareableLink.textContent();
  }

  async copyLink() {
    await this.copyLinkButton.click();
  }

  /** Submit a full request and navigate to dashboard when done. */
  async createAndGoToDashboard(params: {
    recipient: string;
    amount: string;
    note?: string;
  }) {
    await this.fillRecipient(params.recipient);
    await this.fillAmount(params.amount);
    if (params.note) await this.fillNote(params.note);
    await this.submit();
    await this.waitForSuccessScreen();
    await this.goToDashboardButton.click();
    await this.page.waitForURL('/dashboard', { timeout: 10_000 });
  }
}
