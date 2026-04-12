import { type Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('/dashboard');
}

export async function logoutCurrentUser(page: Page) {
  await page.getByTestId('logout-btn').click();
  await page.waitForURL('/login');
}
