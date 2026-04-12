import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { ALICE, BOB } from '../helpers/seed';
import { createTestRequest } from '../helpers/db';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {
  test('sent tab is active by default and shows sent requests', async ({ page }) => {
    await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email, amountCents: 1000 });
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await expect(page.getByTestId('sent-tab')).toHaveAttribute('data-state', 'active');
    const cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  test('received tab shows requests sent to user email', async ({ page }) => {
    await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email, amountCents: 2000 });
    await loginAs(page, BOB.email, BOB.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.clickReceivedTab();
    const cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  test('status filter shows only matching requests', async ({ page }) => {
    await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email, amountCents: 500, status: 'paid' });
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.setStatusFilter('paid');
    const cards = await dashboard.getRequestCards();
    for (const card of cards) {
      await expect(card.getByText('Paid')).toBeVisible();
    }
  });

  test('search filters by counterparty email (case-insensitive)', async ({ page }) => {
    await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.setSearch('BOB@PAYREQUEST');
    const cards = await dashboard.getRequestCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  test('filter + search AND logic shows only matching requests', async ({ page }) => {
    await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email, status: 'pending' });
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.setStatusFilter('paid');
    await dashboard.setSearch(BOB.email);
    await expect(page.getByTestId('no-results-state')).toBeVisible();
  });

  test('no-results state shows "Clear filters" link', async ({ page }) => {
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.setStatusFilter('declined');
    await dashboard.setSearch('nobody@nowhere.com');
    await expect(page.getByTestId('no-results-state')).toBeVisible();
    await expect(page.getByTestId('clear-filters-btn')).toBeVisible();
  });

  test('clicking a request card navigates to detail page', async ({ page }) => {
    const request = await createTestRequest({ senderEmail: ALICE.email, recipientEmail: BOB.email });
    await loginAs(page, ALICE.email, ALICE.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await dashboard.clickRequestCard(0);
    await expect(page).toHaveURL(new RegExp(`/request/${request.id}`));
  });
});
