import { type Page, type Locator } from '@playwright/test';

/**
 * BrainPOP's header search widget, present across the logged-in app.
 * Typing a query surfaces an autocomplete listbox; selecting a suggestion
 * navigates to /search?keyword=... (see SearchResultsPage).
 */

export class SearchBar {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Accessible name flips between "Search BrainPOP" and "Search" once
    // focused, so match on the stable "search" substring instead.

    this.searchInput = page.getByRole('combobox', { name: /search/i });
  }

  async searchFor(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.getByRole('option', { name: query, exact: true }).click();
  }

  /**
   * For a query with no autocomplete match — the suggestion listbox stays
   * empty (0 items), so there's nothing for searchFor() to click. Submits
   * via the visible "Search" button instead, which works regardless of
   * whether any suggestion exists.
   */
  
  async searchForWithNoExpectedSuggestion(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
  }
}
