import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AccountMenu } from '../../pages/AccountMenu';
import { TEST_USERNAME, TEST_PASSWORD, TEST_EMAIL } from '../constants';

test.describe('Login', () => {

  // These tests share a single real test account. Running them in parallel
  // causes concurrent login attempts against that one account, which BrainPOP
  // does not handle reliably, so this suite is forced to run serially.
  
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: { cookies: [], origins: [] } });

  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('logs in successfully with valid credentials and reflects the logged-in state', async ({ page }) => {
    await loginPage.login(TEST_USERNAME, TEST_PASSWORD);

    await expect(page).not.toHaveURL(/\/login\//);
    await new AccountMenu(page).expectAuthenticated();
  });

  test('submits the login form when pressing Enter, not just clicking Log In', async ({ page }) => {
    await loginPage.loginByPressingEnter(TEST_USERNAME, TEST_PASSWORD);

    await expect(page).not.toHaveURL(/\/login\//);
    await new AccountMenu(page).expectAuthenticated();
  });

  test('rejects an invalid username/password combination', async () => {
    await loginPage.login('nonexistent_user_qa_test_12345', 'WrongPassword123!');

    await expect(loginPage.invalidCredentialsError).toBeVisible();
    await expect(loginPage.invalidCredentialsError).toHaveText(/did not match/i);
    await expect(loginPage.page).toHaveURL(/\/login\//);
  });

  test('rejects a real email address used as the username', async () => {

    // BrainPOP logins are username-based, not email-based — a realistic
    // mistake for a user who's used to signing into other sites with an
    // email. This exact mistake was made once during this suite's own
    // setup (an email was entered in .env where the username belonged).
    
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    await expect(loginPage.invalidCredentialsError).toBeVisible();
    await expect(loginPage.invalidCredentialsError).toHaveText(/did not match/i);
    await expect(loginPage.page).toHaveURL(/\/login\//);
  });

  test('blocks submission when both username and password are missing', async () => {
    await loginPage.submitEmpty();

    await expect(loginPage.usernameRequiredError).toBeVisible();
    await expect(loginPage.passwordRequiredError).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login\//);
  });

  test('blocks submission when only the password is provided', async () => {
    await loginPage.passwordInput.fill('SomePassword123!');
    await loginPage.loginButton.click();

    await expect(loginPage.usernameRequiredError).toBeVisible();
    await expect(loginPage.passwordRequiredError).not.toBeVisible();
  });

  test('blocks submission when only the username is provided', async () => {
    await loginPage.usernameInput.fill('someusername');
    await loginPage.loginButton.click();

    await expect(loginPage.passwordRequiredError).toBeVisible();
    await expect(loginPage.usernameRequiredError).not.toBeVisible();
  });

  test('toggles password visibility via the Show password checkbox', async () => {
    await loginPage.passwordInput.fill('SecretPass123');

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.showPasswordCheckboxState).not.toBeChecked();

    await loginPage.showPasswordCheckbox.click();

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await expect(loginPage.passwordInput).toHaveValue('SecretPass123');
    await expect(loginPage.showPasswordCheckboxState).toBeChecked();

    await loginPage.showPasswordCheckbox.click();

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.showPasswordCheckboxState).not.toBeChecked();
  });

  test('hands off to Google for OAuth sign-in', async ({ page }) => {

    // A full negative-path assertion (BrainPOP's "Can't Sign in With Google"
    // rejection, confirmed manually) would require actually authenticating
    // with a real, unlinked Google account on Google's own login page from
    // here — Google actively blocks automated/Playwright-driven sign-ins,
    // and this account has no Google credentials to use anyway. What's
    // reliably verifiable in an automated, credential-less run is that
    // BrainPOP correctly hands off to Google's real OAuth endpoint with the
    // right callback registered.

    await loginPage.googleSignInLink.click();

    await expect(page).toHaveURL(
      /^https:\/\/accounts\.google\.com\/.*redirect_uri=https%3A%2F%2Fapi\.brainpop\.com%2Fapi%2Fgoogle%2Fcallback/
    );
  });

  test('hands off to Clever for OAuth, and rejects a callback with no valid authorization', async ({ page }) => {

    // Verify the redirect leg: the button correctly hands off to Clever's
    // real OAuth domain. Driving Clever's own login form from here would
    // need real Clever credentials this account doesn't have, so instead...

    await loginPage.cleverSignInLink.click();
    await expect(page).toHaveURL(/^https:\/\/(www\.)?clever\.com\/oauth\//);

    // ...verify the failure leg directly: hitting BrainPOP's own callback
    // endpoint with no authorization code is what an unlinked/failed Clever
    // handshake produces, and BrainPOP should reject it with a clear error.

    await loginPage.hitCleverCallbackWithoutAuthorization();

    await expect(page).toHaveURL(/\/login\/\?error=error-generating-token/);
    await expect(loginPage.cleverSsoErrorHeading).toBeVisible();
  });

  test('redirects away from /login/ when already authenticated', async ({ page }) => {
    await loginPage.login(TEST_USERNAME, TEST_PASSWORD);
    await new AccountMenu(page).expectAuthenticated();

    // A logged-in user shouldn't see the login form again on a manual
    // /login/ visit — confirm they're redirected elsewhere instead.

    await loginPage.goto();

    await expect(page).not.toHaveURL(/\/login\//);
  });

  test('logs out and ends the authenticated session', async ({ page }) => {
    const accountMenu = new AccountMenu(page);

    await loginPage.login(TEST_USERNAME, TEST_PASSWORD);
    await accountMenu.expectAuthenticated();

    await accountMenu.logOut();
    await accountMenu.expectUnauthenticated();

    // A protected route should bounce an unauthenticated session back to login.

    await page.goto('/dashboard/');
    await expect(page).toHaveURL(/\/login\//);
  });
});
