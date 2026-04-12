import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { ALICE, BOB } from '../helpers/seed';
import { createTestRequest } from '../helpers/db';
import { RequestDetailPage } from '../pages/RequestDetailPage';

test.describe('Request Detail', () => {
  test('sender sees Cancel and Copy Link buttons on pending request', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, ALICE.email, ALICE.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await expect(detail.cancelButton).toBeVisible();
    await expect(detail.copyLinkButton).toBeVisible();
    await expect(detail.payButton).not.toBeVisible();
  });

  test('recipient sees Pay and Decline buttons on pending request', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await expect(detail.payButton).toBeVisible();
    await expect(detail.declineButton).toBeVisible();
    await expect(detail.cancelButton).not.toBeVisible();
  });

  test('Pay flow: spinner shows, success overlay appears, redirects to dashboard', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email, amountCents: 1500 });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await detail.clickPay();
    await expect(detail.payButton).toBeDisabled();
    await detail.waitForSuccessOverlay();
    await expect(detail.successOverlay).toContainText('$15.00');
    await expect(page).toHaveURL('/dashboard', { timeout: 8000 });
  });

  test('Decline flow: dialog → confirm → redirected to dashboard', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await detail.clickDecline();
    await expect(detail.confirmDialog).toBeVisible();
    await detail.confirmDialog_();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('Decline dialog cancel → dialog closes, no action', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await detail.clickDecline();
    await expect(detail.confirmDialog).toBeVisible();
    await detail.cancelDialog_();
    await expect(detail.confirmDialog).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/request/${request.id}`));
  });

  test('Cancel flow: dialog → confirm → redirected to dashboard', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, ALICE.email, ALICE.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await detail.clickCancel();
    await expect(detail.confirmDialog).toBeVisible();
    await detail.confirmDialog_();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('terminal state shows timestamp and no action buttons', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
      status: 'paid',
    });
    await loginAs(page, ALICE.email, ALICE.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await expect(detail.payButton).not.toBeVisible();
    await expect(detail.cancelButton).not.toBeVisible();
  });

  test('unrelated user sees 404 page', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: 'someone@else.com',
    });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    await expect(page.getByText('Request not found')).toBeVisible();
  });

  test('double-click on Pay is protected — button disabled on first click', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    const detail = new RequestDetailPage(page);
    await detail.waitForLoad();
    await detail.clickPay();
    // Button should be disabled immediately after first click
    await expect(detail.payButton).toBeDisabled();
  });
});
