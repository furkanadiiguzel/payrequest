import { type Page, type Locator } from '@playwright/test';

export class RequestDetailPage {
  readonly page: Page;
  readonly amount: Locator;
  readonly status: Locator;
  readonly payButton: Locator;
  readonly declineButton: Locator;
  readonly cancelButton: Locator;
  readonly copyLinkButton: Locator;
  readonly confirmDialog: Locator;
  readonly dialogConfirm: Locator;
  readonly dialogCancel: Locator;
  readonly successOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.amount = page.getByTestId('request-amount');
    this.status = page.getByTestId('request-status');
    this.payButton = page.getByTestId('pay-button');
    this.declineButton = page.getByTestId('decline-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.copyLinkButton = page.getByTestId('copy-link-button');
    this.confirmDialog = page.getByTestId('confirm-dialog');
    this.dialogConfirm = page.getByTestId('dialog-confirm');
    this.dialogCancel = page.getByTestId('dialog-cancel');
    this.successOverlay = page.getByTestId('payment-success-overlay');
  }

  async waitForLoad() {
    await this.amount.waitFor();
  }

  async getAmount() {
    return this.amount.textContent();
  }

  async getStatus() {
    return this.status.textContent();
  }

  async clickPay() {
    await this.payButton.click();
  }

  async clickDecline() {
    await this.declineButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async confirmDialog_() {
    await this.dialogConfirm.click();
  }

  async cancelDialog_() {
    await this.dialogCancel.click();
  }

  async waitForSuccessOverlay() {
    await this.successOverlay.waitFor({ timeout: 10000 });
  }

  async clickCopyLink() {
    await this.copyLinkButton.click();
  }
}
