import { type Page } from '@playwright/test';

/** The logged-in app homepage (redirects to /teacher). */

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }
}
