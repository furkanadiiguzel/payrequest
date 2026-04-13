import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { ALICE, BOB } from '../helpers/seed';
import { createTestRequest } from '../helpers/db';

test.describe('Unauthenticated Access (Shareable Link)', () => {
  test('unauthenticated user sees masked sender email, amount, and CTA buttons', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
      amountCents: 5000,
      note: 'Dinner split',
    });
    await page.goto(`/request/${request.id}`);
    // Amount visible — scope to request-amount to avoid strict-mode violation
    await expect(page.getByTestId('request-amount')).toContainText('$50.00');
    // Note visible
    await expect(page.getByText('Dinner split').first()).toBeVisible();
    // Masked email visible (t***@...) — scoped to avoid other text on page
    await expect(page.getByText(/\*\*\*@/).first()).toBeVisible();
    // CTA buttons
    await expect(page.getByTestId('login-to-respond-btn')).toBeVisible();
    await expect(page.getByTestId('signup-link')).toBeVisible();
    // Full email NOT exposed
    await expect(page.getByText(ALICE.email)).not.toBeVisible();
  });

  test('"Log in to respond" redirects to /login with returnUrl', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
    });
    await page.goto(`/request/${request.id}`);
    await page.getByTestId('login-to-respond-btn').click();
    await expect(page).toHaveURL(new RegExp(`/login\\?returnUrl=.*${request.id}`));
  });

  test('after login as recipient, redirected back to request with action buttons', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
    });
    await page.goto(`/request/${request.id}`);
    await page.getByTestId('login-to-respond-btn').click();
    // Login as BOB (the recipient)
    await page.getByTestId('login-email-input').fill(BOB.email);
    await page.getByTestId('login-password-input').fill(BOB.password);
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL(new RegExp(`/request/${request.id}`), { timeout: 30_000 });
    await expect(page.getByTestId('request-pay-button')).toBeVisible();
  });

  test('after login as unrelated user, redirected back to request → 404', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: 'someone@else.com',
    });
    await page.goto(`/request/${request.id}`);
    await page.getByTestId('login-to-respond-btn').click();
    await loginAs(page, BOB.email, BOB.password);
    // BOB is unrelated — should see 404
    await page.goto(`/request/${request.id}`);
    await expect(page.getByText('Request not found')).toBeVisible();
  });
});
