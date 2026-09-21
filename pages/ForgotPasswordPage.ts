import { type Page, type Locator } from '@playwright/test';

/**
 * BrainPOP's password-reset flow (/password-reminder/), reached from the
 * login page's "Forgot username or password?" button. A distinct page
 * template from the login page itself, so it gets its own page object
 * rather than being folded into LoginPage.
 */

export class ForgotPasswordPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly nextButton: Locator;
  readonly usernameRequiredError: Locator;
  readonly usernameNotFoundError: Locator;
  readonly emailVerificationHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Reset Password', level: 1 });
    this.usernameInput = page.getByPlaceholder('Username');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.usernameRequiredError = page.getByText(/please enter your username/i);
    this.usernameNotFoundError = page.getByText(/couldn.t find an account with that username/i);
    this.emailVerificationHeading = page.getByRole('heading', { name: 'Email Verification' });
  }

  async goto() {
    await this.page.goto('/password-reminder/');
  }

  async submitUsername(username: string) {
    await this.usernameInput.fill(username);
    await this.nextButton.click();
  }
}
