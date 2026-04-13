import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../helpers/auth';
import { createRequest } from '../helpers/request';
import { createTestRequest } from '../helpers/db';
import { USER1, USER2 } from '../helpers/seed';
import { DashboardPage } from '../pages/DashboardPage';
import { RequestFormPage } from '../pages/RequestFormPage';
import { RequestDetailPage } from '../pages/RequestDetailPage';

test.describe('P2P Payment Requests', () => {
  test('should create a new payment request', async ({ page }) => {
    test.setTimeout(90_000);

    await loginAs(page, USER1.email, USER1.password);

    const form = new RequestFormPage(page);
    await form.goto();
    await form.fillRecipient(USER2.email);
    await form.fillAmount('73.00');
    await form.fillNote('Dinner split');
    await form.submit();
    await form.waitForSuccessScreen();

    // Shareable link is displayed
    const link = await form.getShareableLink();
    expect(link).toMatch(/\/request\//);

    // Go to dashboard and verify the card appears in Sent tab
    await page.getByTestId('go-to-dashboard-btn').click();
    await page.waitForURL('/dashboard', { timeout: 15_000 });

    const dashboard = new DashboardPage(page);
    await dashboard.clickSentTab();

    const cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThanOrEqual(1);

    // Most recent card (first) should show the amount and recipient
    const firstCard = cards[0];
    await expect(firstCard).toContainText('$73.00');
    await expect(firstCard).toContainText(USER2.email);
  });

  test('should validate request form inputs', async ({ page }) => {
    test.setTimeout(90_000);

    await loginAs(page, USER1.email, USER1.password);

    const form = new RequestFormPage(page);
    await form.goto();

    // Submit with all fields empty
    await form.submit();
    const recipientError = await form.getFieldError('recipient');
    const amountError = await form.getFieldError('amount');
    expect(recipientError).toBeTruthy();
    expect(amountError).toBeTruthy();

    // Amount = 0 should be rejected
    await form.fillRecipient(USER2.email);
    await form.fillAmount('0');
    await form.submit();
    const zeroError = await form.getFieldError('amount');
    expect(zeroError).toBeTruthy();

    // Amount > $10,000 should be rejected
    await form.fillAmount('10001');
    await form.submit();
    const overLimitError = await form.getFieldError('amount');
    expect(overLimitError).toBeTruthy();

    // Invalid email format
    await form.fillRecipient('not-an-email');
    await form.fillAmount('50');
    await form.submit();
    const invalidEmailError = await form.getFieldError('recipient');
    expect(invalidEmailError).toBeTruthy();

    // Self-request (USER1 requesting from themselves) — caught client-side
    await form.fillRecipient(USER1.email);
    await form.fillAmount('50');
    await form.submit();
    const selfError = await form.getFieldError('recipient');
    expect(selfError).toBeTruthy();
  });

  test('should pay an incoming request', async ({ page }) => {
    test.setTimeout(90_000);

    // USER1 sends $41.00 to USER2
    const request = await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 4100,
      note: 'Coffee money',
    });

    // USER2 opens the request and pays
    await loginAs(page, USER2.email, USER2.password);
    const detail = new RequestDetailPage(page);
    await detail.goto(request.id);

    await expect(detail.payButton).toBeVisible();
    await expect(detail.amount).toContainText('$41.00');

    await detail.pay();

    // Success overlay shows the amount
    await expect(detail.successOverlay).toContainText('$41.00');

    // Auto-redirects to dashboard after overlay
    await page.waitForURL('/dashboard', { timeout: 15_000 });

    // Navigate directly to the request to verify paid status
    await page.goto(`/request/${request.id}`);
    const detail2 = new RequestDetailPage(page);
    await detail2.waitForLoad();
    await expect(detail2.status).toContainText('Paid');
  });

  test('should decline an incoming request', async ({ page }) => {
    test.setTimeout(90_000);

    // USER1 sends $58.00 to USER2
    const request = await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 5800,
    });

    // USER2 declines
    await loginAs(page, USER2.email, USER2.password);
    const detail = new RequestDetailPage(page);
    await detail.goto(request.id);

    await expect(detail.declineButton).toBeVisible();
    await detail.decline();

    // Should redirect to dashboard after confirm
    await page.waitForURL('/dashboard', { timeout: 15_000 });

    // Navigate directly to the request to verify declined status
    await page.goto(`/request/${request.id}`);
    const detail2 = new RequestDetailPage(page);
    await detail2.waitForLoad();
    await expect(detail2.status).toContainText('Declined');
  });

  test('should cancel an outgoing request', async ({ page }) => {
    test.setTimeout(90_000);

    // USER1 sends $67.00 to USER2
    const request = await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 6700,
    });

    // USER1 (sender) cancels
    await loginAs(page, USER1.email, USER1.password);
    const detail = new RequestDetailPage(page);
    await detail.goto(request.id);

    await expect(detail.cancelButton).toBeVisible();
    await expect(detail.payButton).not.toBeVisible();
    await detail.cancel();

    // Should redirect to dashboard after confirm
    await page.waitForURL('/dashboard', { timeout: 15_000 });

    // Navigate directly to the request to verify cancelled status
    await page.goto(`/request/${request.id}`);
    const detail2 = new RequestDetailPage(page);
    await detail2.waitForLoad();
    await expect(detail2.status).toContainText('Cancelled');
  });

  test('should filter requests by status', async ({ page }) => {
    test.setTimeout(60_000);

    // Create one pending and one paid request for USER1 as sender
    await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 3400,
      status: 'pending',
    });
    await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 8900,
      status: 'paid',
    });

    await loginAs(page, USER1.email, USER1.password);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickSentTab();

    // Filter by pending — all visible cards should be pending
    await dashboard.setStatusFilter('pending');
    let cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThanOrEqual(1);
    for (const card of cards) {
      await expect(card).not.toContainText('paid');
    }

    // Filter by paid — all visible cards should be paid
    await dashboard.setStatusFilter('paid');
    cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThanOrEqual(1);
    for (const card of cards) {
      await expect(card).not.toContainText('pending');
    }

    // Clear filter — should see both
    await dashboard.setStatusFilter('all');
    const allCards = await dashboard.getRequestCards();
    expect(allCards.length).toBeGreaterThanOrEqual(2);
  });

  test('should search requests by email', async ({ page }) => {
    test.setTimeout(60_000);

    // Create a request to USER2 from USER1
    await createTestRequest({
      senderEmail: USER1.email,
      recipientEmail: USER2.email,
      amountCents: 2200,
    });

    await loginAs(page, USER1.email, USER1.password);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickSentTab();

    // Search by USER2's email — should find the request
    await dashboard.setSearch(USER2.email);
    const matchedCards = await dashboard.getRequestCards();
    expect(matchedCards.length).toBeGreaterThanOrEqual(1);
    await expect(matchedCards[0]).toContainText(USER2.email);

    // Search by a non-existent email — should show no cards
    await dashboard.setSearch('nobody@nonexistent.test');
    const emptyCards = await dashboard.getRequestCards();
    expect(emptyCards.length).toBe(0);
  });
});
