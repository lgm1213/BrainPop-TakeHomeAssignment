import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly showPasswordCheckbox: Locator;
  readonly showPasswordCheckboxState: Locator;
  readonly loginButton: Locator;
  readonly invalidCredentialsError: Locator;
  readonly usernameRequiredError: Locator;
  readonly passwordRequiredError: Locator;
  readonly forgotCredentialsButton: Locator;
  readonly googleSignInLink: Locator;
  readonly cleverSignInLink: Locator;
  readonly cleverSsoErrorHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Username:' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password:' });

    // The underlying checkbox input is visually hidden (sr-only) behind a
    // custom-styled wrapper, which intercepts pointer events on it directly.
    // Its visible text label is the actual clickable surface; the role-based
    // locator is kept separately, read-only, for asserting checked state.

    this.showPasswordCheckbox = page.getByText('Show password', { exact: true });
    this.showPasswordCheckboxState = page.getByRole('checkbox', { name: 'Show password' });
    this.loginButton = page.getByRole('button', { name: 'Log In', exact: true });
    this.invalidCredentialsError = page.getByRole('alert').filter({ hasText: 'did not match' });
    this.usernameRequiredError = page.getByRole('alert').filter({ hasText: 'username' });
    this.passwordRequiredError = page.getByRole('alert').filter({ hasText: 'password' });
    this.forgotCredentialsButton = page.getByRole('button', { name: 'Forgot username or password?' });
    this.googleSignInLink = page.getByRole('link', { name: 'Sign in with Google' });
    this.cleverSignInLink = page.getByRole('link', { name: 'Sign in with Clever' });
    this.cleverSsoErrorHeading = page.getByRole('heading', { name: "Can't Sign in With Clever" });
  }

  async goto() {
    await this.page.goto('/login/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async submitEmpty() {
    await this.loginButton.click();
  }

  /**
   * Same as login(), but submits by pressing Enter in the password field
   * instead of clicking the Log In button — a real, common way users
   * submit forms that the click-only login() never exercises.
   */
  
  async loginByPressingEnter(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }

  /**
   * Simulates BrainPOP's Clever OAuth callback being hit with no valid
   * authorization code attached — the state Clever's redirect produces for
   * an account with no BrainPOP/Clever link. Used to exercise the failure
   * path without driving Clever's real third-party login UI, which needs
   * real Clever credentials this account doesn't have.
   */

  async hitCleverCallbackWithoutAuthorization() {
    await this.page.goto('https://api.brainpop.com/api/clevercallback/bp/en');
  }
}
