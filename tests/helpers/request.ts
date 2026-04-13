import { type Page } from '@playwright/test';

interface CreateRequestParams {
  recipientEmail: string;
  amount: string;      // e.g. "25.00"
  note?: string;
}

/**
 * Create a payment request through the UI.
 * The caller must already be logged in.
 *
 * Flow:
 *   /request/new → fill form → submit → wait for SuccessScreen → click "Go to dashboard" → /dashboard
 */
export async function createRequest(
  page: Page,
  { recipientEmail, amount, note }: CreateRequestParams
): Promise<void> {
  await page.goto('/request/new');

  // Fill recipient
  await page.getByTestId('request-recipient-input').fill(recipientEmail);

  // Fill amount — click into the field first to avoid the $ prefix intercepting
  await page.getByTestId('request-amount-input').click();
  await page.getByTestId('request-amount-input').fill(amount);
  // Blur to trigger the onBlur formatter (100 → 100.00)
  await page.getByTestId('request-amount-input').blur();

  // Fill optional note
  if (note) {
    await page.getByTestId('request-note-input').fill(note);
  }

  // Submit
  await page.getByTestId('request-submit-button').click();

  // Wait for SuccessScreen
  await page.getByTestId('success-screen').waitFor({ timeout: 15_000 });

  // Click "Go to dashboard" to skip the 3-second auto-redirect
  await page.getByTestId('go-to-dashboard-btn').click();

  // Confirm we reached the dashboard
  await page.waitForURL('/dashboard', { timeout: 10_000 });
}
