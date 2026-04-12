import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { ALICE, BOB } from '../helpers/seed';
import { RequestFormPage } from '../pages/RequestFormPage';

test.describe('Create Payment Request', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ALICE.email, ALICE.password);
  });

  test('valid email recipient → success screen with shareable link', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('25.00');
    await form.fillNote('Lunch split');
    await form.submit();
    await expect(form.successScreen).toBeVisible();
    const link = await form.shareableLink.textContent();
    expect(link).toContain('/request/');
  });

  test('valid phone formats create request successfully', async ({ page }) => {
    const form = new RequestFormPage(page);
    for (const phone of ['+1 (555) 123-4567', '555-123-4567', '5551234567']) {
      await form.goto();
      await form.fillRecipient(phone);
      await form.fillAmount('10.00');
      await form.submit();
      await expect(form.successScreen).toBeVisible({ timeout: 5000 });
    }
  });

  test('invalid email shows inline error', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient('notanemail');
    await form.fillAmount('10.00');
    await form.submit();
    await expect(page.getByTestId('recipient-error')).toBeVisible();
  });

  test('amount of $0 shows inline error', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('0');
    await form.submit();
    await expect(page.getByTestId('amount-error')).toBeVisible();
  });

  test('amount exceeding $10,000 shows inline error', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('10001');
    await form.submit();
    await expect(page.getByTestId('amount-error')).toBeVisible();
  });

  test('amount with 3 decimal places shows inline error', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('25.555');
    await form.submit();
    await expect(page.getByTestId('amount-error')).toBeVisible();
  });

  test('note counter turns red and submit disables at 280 chars', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillNote('a'.repeat(281));
    await expect(page.getByTestId('note-counter')).toHaveClass(/text-red-600/);
    await expect(form.submitButton).toBeDisabled();
  });

  test('self-request shows inline error', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(ALICE.email);
    await form.fillAmount('10.00');
    await form.submit();
    // Server action returns error shown as toast — check for toast or form-level error
    await expect(page.getByText('cannot request money from yourself')).toBeVisible({ timeout: 5000 });
  });

  test('copy link button copies URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('15.00');
    await form.submit();
    await expect(form.successScreen).toBeVisible();
    await form.copyLink();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/request/');
  });

  test('success screen auto-redirects to dashboard after 3 seconds', async ({ page }) => {
    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(BOB.email);
    await form.fillAmount('5.00');
    await form.submit();
    await expect(form.successScreen).toBeVisible();
    await expect(page).toHaveURL('/dashboard', { timeout: 6000 });
  });
});
