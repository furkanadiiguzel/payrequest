import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { loginAs, logout as logoutCurrentUser } from '../helpers/auth';
import { ALICE } from '../helpers/seed';

test.describe('Authentication', () => {
  test('signup with valid credentials auto-logs in and redirects to dashboard', async ({ page }) => {
    const signup = new SignupPage(page);
    const uniqueEmail = `test_${Date.now()}@payrequest.test`;
    await signup.goto();
    await signup.fillEmail(uniqueEmail);
    await signup.fillPassword('TestPass123!');
    await signup.submit();
    await expect(page).toHaveURL('/dashboard', { timeout: 30_000 });
  });

  test('signup with duplicate email shows inline error', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillEmail(ALICE.email);
    await signup.fillPassword(ALICE.password);
    await signup.submit();
    await expect(signup.errorMessage).toBeVisible();
  });

  test('signup with password shorter than 6 characters shows inline error', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fillEmail(`short_${Date.now()}@payrequest.test`);
    await signup.fillPassword('abc');
    await signup.submit();
    await expect(page.getByTestId('password-error')).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillEmail(ALICE.email);
    await login.fillPassword(ALICE.password);
    await login.submit();
    await expect(page).toHaveURL('/dashboard', { timeout: 30_000 });
  });

  test('login with invalid credentials shows error message', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillEmail(ALICE.email);
    await login.fillPassword('wrongpassword');
    await login.submit();
    const error = await login.getError();
    expect(error).toContain('Invalid email or password');
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    await loginAs(page, ALICE.email, ALICE.password);
    await logoutCurrentUser(page);
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated access to /dashboard redirects to /login with returnUrl', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?returnUrl=/);
  });

  test('login with returnUrl redirects to the preserved URL', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    await page.getByTestId('login-email-input').fill(ALICE.email);
    await page.getByTestId('login-password-input').fill(ALICE.password);
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 30_000 });
  });

  test('rate-limit locks out after 5 failed attempts', async ({ page }) => {
    const lockedEmail = `locked_${Date.now()}@test.com`;
    const login = new LoginPage(page);
    await login.goto();

    for (let i = 0; i < 5; i++) {
      await login.fillEmail(lockedEmail);
      await login.fillPassword('wrongpass');
      await login.submit();
    }

    // 6th attempt should show lockout message
    await login.fillEmail(lockedEmail);
    await login.fillPassword('wrongpass');
    await login.submit();
    const error = await login.getError();
    expect(error).toContain('temporarily locked');
  });
});
