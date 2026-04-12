import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { ALICE, BOB } from '../helpers/seed';
import { createTestRequest } from '../helpers/db';

const PAST_DATE = new Date(Date.now() - 1000).toISOString(); // 1 second in the past

test.describe('Request Expiration', () => {
  test('expired request on dashboard shows gray "Expired" badge', async ({ page }) => {
    await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
      expiresAt: PAST_DATE,
    });
    await loginAs(page, ALICE.email, ALICE.password);
    await page.goto('/dashboard');
    await expect(page.getByText('Expired').first()).toBeVisible();
  });

  test('expired request detail shows banner and no action buttons', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
      expiresAt: PAST_DATE,
    });
    await loginAs(page, BOB.email, BOB.password);
    await page.goto(`/request/${request.id}`);
    await expect(page.getByText(/expired on/i)).toBeVisible();
    await expect(page.getByTestId('pay-button')).not.toBeVisible();
    await expect(page.getByTestId('decline-button')).not.toBeVisible();
  });

  test('expired request via shareable link shows "This request has expired" banner', async ({ page }) => {
    const request = await createTestRequest({
      senderEmail: ALICE.email,
      recipientEmail: BOB.email,
      expiresAt: PAST_DATE,
    });
    // Visit as unauthenticated
    await page.goto(`/request/${request.id}`);
    await expect(page.getByText('This request has expired')).toBeVisible();
  });
});
