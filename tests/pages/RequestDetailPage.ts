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
  readonly loginToRespondBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.amount = page.getByTestId('request-amount');
    this.status = page.getByTestId('request-status');
    this.payButton = page.getByTestId('request-pay-button');
    this.declineButton = page.getByTestId('request-decline-button');
    this.cancelButton = page.getByTestId('request-cancel-button');
    this.copyLinkButton = page.getByTestId('copy-link-button');
    this.confirmDialog = page.getByTestId('confirm-dialog').first();
    this.dialogConfirm = page.getByTestId('dialog-confirm').first();
    this.dialogCancel = page.getByTestId('dialog-cancel').first();
    this.successOverlay = page.getByTestId('payment-success-overlay');
    this.loginToRespondBtn = page.getByTestId('login-to-respond-btn');
  }

  async goto(requestId: string) {
    await this.page.goto(`/request/${requestId}`);
    await this.amount.waitFor({ timeout: 10_000 });
  }

  async waitForLoad() {
    await this.amount.waitFor({ timeout: 10_000 });
  }

  async getAmount() {
    return this.amount.textContent();
  }

  async getStatus() {
    return this.status.textContent();
  }

  /** Click Pay and wait for the success overlay (up to 10 s for 2-3 s sim delay). */
  async pay() {
    await this.payButton.click();
    await this.successOverlay.waitFor({ timeout: 10_000 });
  }

  /** Click Decline and confirm in the dialog. */
  async decline() {
    await this.declineButton.click();
    await this.confirmDialog.waitFor();
    await this.dialogConfirm.click();
    await this.page.waitForURL('/dashboard', { timeout: 10_000 });
  }

  /** Click Cancel and confirm in the dialog. */
  async cancel() {
    await this.cancelButton.click();
    await this.confirmDialog.waitFor();
    await this.dialogConfirm.click();
    await this.page.waitForURL('/dashboard', { timeout: 10_000 });
  }

  async copyLink() {
    await this.copyLinkButton.click();
  }

  // ── Backward-compatible aliases used by older spec files ─────────────────

  async clickPay() {
    await this.payButton.click();
  }

  async waitForSuccessOverlay() {
    await this.successOverlay.waitFor({ timeout: 10_000 });
  }

  async clickDecline() {
    await this.declineButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  /** Confirm the currently-open dialog. */
  async confirmDialog_() {
    await this.dialogConfirm.click();
  }

  /** Dismiss (cancel) the currently-open dialog. */
  async cancelDialog_() {
    await this.dialogCancel.click();
  }
}
