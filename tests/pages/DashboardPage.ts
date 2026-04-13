import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sentTab: Locator;
  readonly receivedTab: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly clearFiltersBtn: Locator;
  readonly newRequestBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sentTab = page.getByTestId('dashboard-sent-tab');
    this.receivedTab = page.getByTestId('dashboard-received-tab');
    this.searchInput = page.getByTestId('search-input');
    this.statusFilter = page.getByTestId('status-filter');
    this.clearFiltersBtn = page.getByTestId('clear-filters-btn');
    this.newRequestBtn = page.getByTestId('nav-new-request');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.sentTab.waitFor({ timeout: 15_000 });
  }

  async waitForLoad() {
    await this.page.waitForURL('/dashboard');
    await this.sentTab.waitFor({ timeout: 15_000 });
  }

  async clickSentTab() {
    await this.sentTab.click();
  }

  async clickReceivedTab() {
    await this.receivedTab.click();
  }

  async setStatusFilter(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async setSearch(query: string) {
    await this.searchInput.fill(query);
  }

  async clearFilters() {
    await this.clearFiltersBtn.click();
  }

  /** Returns all visible request cards in the active tab. */
  async getRequestCards() {
    return this.page.getByTestId('request-card').all();
  }

  async clickRequestCard(index: number) {
    const cards = await this.getRequestCards();
    await cards[index].click();
  }

  async clickNewRequest() {
    await this.newRequestBtn.click();
    await this.page.waitForURL('/request/new');
  }
}
