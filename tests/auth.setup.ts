import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AccountMenu } from '../pages/AccountMenu';
import { AUTH_STORAGE_STATE, TEST_USERNAME, TEST_PASSWORD } from './constants';

/**
 * Runs once before any project that depends on it (see playwright.config.ts).
 * Logs in through the real UI once and persists the resulting storage state
 * so downstream tests can start already authenticated, without each test
 * re-driving the login form itself. See tests/login/login.spec.ts for
 * coverage of the login flow.
 */

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USERNAME, TEST_PASSWORD);

  await new AccountMenu(page).expectAuthenticated();

  await page.context().storageState({ path: AUTH_STORAGE_STATE });
});
