import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { TEST_USERNAME } from '../constants';

test.describe('Forgot username or password', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('navigates from the login page to the password reset flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.forgotCredentialsButton.click();

    await expect(page).toHaveURL(/\/password-reminder\//);
    await expect(new ForgotPasswordPage(page).heading).toBeVisible();
  });

  test('blocks submission when the username is missing', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.nextButton.click();

    await expect(forgotPasswordPage.usernameRequiredError).toBeVisible();
    await expect(page).toHaveURL(/\/password-reminder\//);
  });

  test('rejects a username with no matching account', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.submitUsername('nonexistent_user_qa_test_98765');

    await expect(forgotPasswordPage.usernameNotFoundError).toBeVisible();
    await expect(forgotPasswordPage.emailVerificationHeading).not.toBeVisible();
  });

  test('advances to email verification for a real username, without sending a reset email', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();

    await forgotPasswordPage.submitUsername(TEST_USERNAME);

    // Deliberately stops here: this step exists to prove the account lookup
    // succeeded and the flow correctly progresses. Submitting an email here
    // would trigger a real password-reset email — not something an
    // automated suite should do to a real account on every run.
    
    await expect(forgotPasswordPage.emailVerificationHeading).toBeVisible();
  });
});
