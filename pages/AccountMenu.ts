import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The authenticated-state header controls (Dashboard link, account menu,
 * Log Out). Kept separate from LoginPage since it represents session state
 * rather than the login form itself, and is what other tests in a larger
 * suite would use to assert "am I logged in" or to log out, without caring
 * how the session was established.
 */

export class AccountMenu {
  readonly page: Page;
  readonly dashboardLink: Locator;
  readonly accountMenuButton: Locator;
  readonly logOutMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;

    // The "Dashboard" nav link only renders for an authenticated session, on
    // every page template the app redirects to, making it a reliable signal
    // in both directions (unlike "Log In", whose presence/location varies:
    // it's absent on /login/ itself, and duplicated on marketing pages).

    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });

    // The account menu button's accessible name is the user's first name, so
    // it's located structurally (the nav list that also holds "Dashboard")
    // rather than by a hardcoded, account-specific name.

    this.accountMenuButton = page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('list')
      .filter({ has: this.dashboardLink })
      .getByRole('button');
    this.logOutMenuItem = page.getByRole('menuitem', { name: 'Log Out' });
  }

  async expectAuthenticated() {
    await expect(this.dashboardLink).toBeVisible();
  }

  async expectUnauthenticated() {
    await expect(this.dashboardLink).not.toBeVisible();
  }

  async logOut() {
    await this.accountMenuButton.click();
    await this.logOutMenuItem.click();
  }
}
