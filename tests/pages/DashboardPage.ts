import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sentTab: Locator;
  readonly receivedTab: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly clearFiltersBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sentTab = page.getByTestId('sent-tab');
    this.receivedTab = page.getByTestId('received-tab');
    this.searchInput = page.getByTestId('search-input');
    this.statusFilter = page.getByTestId('status-filter');
    this.clearFiltersBtn = page.getByTestId('clear-filters-btn');
  }

  async waitForLoad() {
    await this.page.waitForURL('/dashboard');
    await this.sentTab.waitFor();
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

  async getRequestCards() {
    return this.page.getByTestId('request-card').all();
  }

  async clickRequestCard(index: number) {
    const cards = await this.getRequestCards();
    await cards[index].click();
  }
}
