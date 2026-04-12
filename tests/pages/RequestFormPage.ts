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

  constructor(page: Page) {
    this.page = page;
    this.recipientInput = page.getByTestId('recipient-input');
    this.amountInput = page.getByTestId('amount-input');
    this.noteInput = page.getByTestId('note-input');
    this.submitButton = page.getByTestId('request-submit');
    this.successScreen = page.getByTestId('success-screen');
    this.shareableLink = page.getByTestId('shareable-link');
    this.copyLinkButton = page.getByTestId('copy-link-btn');
  }

  async goto() {
    await this.page.goto('/request/new');
  }

  async fillRecipient(value: string) {
    await this.recipientInput.fill(value);
  }

  async fillAmount(value: string) {
    await this.amountInput.fill(value);
  }

  async fillNote(value: string) {
    await this.noteInput.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getFieldError(field: 'recipient' | 'amount' | 'note') {
    return this.page.getByTestId(`${field}-error`).textContent();
  }

  async getSuccessScreen() {
    return this.successScreen;
  }

  async copyLink() {
    await this.copyLinkButton.click();
  }
}
