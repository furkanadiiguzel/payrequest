import { type Page } from '@playwright/test';

/**
 * Log in as an existing user via the /login page.
 * Waits for the redirect to /dashboard before resolving.
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL('/dashboard', { timeout: 30_000 });
}

/**
 * Create a new account via the /signup page.
 * Waits for the redirect to /dashboard before resolving.
 */
export async function signUp(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/signup');
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill(password);
  await page.getByTestId('signup-submit-button').click();
  await page.waitForURL('/dashboard', { timeout: 30_000 });
}

/**
 * Log out the currently authenticated user.
 * Waits for the redirect to /login before resolving.
 */
export async function logout(page: Page): Promise<void> {
  await page.getByTestId('logout-btn').click();
  await page.waitForURL('/login', { timeout: 10_000 });
}

/** Alias for logout — kept for backward compatibility with older spec files. */
export const logoutCurrentUser = logout;
