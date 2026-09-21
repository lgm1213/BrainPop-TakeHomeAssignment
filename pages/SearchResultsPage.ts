import { type Page, type Locator } from '@playwright/test';

/** BrainPOP's /search?keyword=... results page. */

export class SearchResultsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /^Search Results for/ });

    // Apostrophe in "you're" may render as a typographic quote — matched
    // with a regex rather than an exact string, same reasoning as
    // ForgotPasswordPage's "couldn't find an account" message.
    
    this.noResultsMessage = page.getByText(/Try adjusting your search/i);
  }

  topicResultLink(topicName: string): Locator {

    // Each result's accessible name is "{Topic Name} {Product}" (e.g.
    // "Acceleration BrainPOP (3-8+)"); anchored + word-boundary so a topic
    // whose name merely starts the same way can't match unintentionally.

    return this.page.getByRole('link', { name: new RegExp(`^${topicName}\\b`) });
  }

  async selectTopicResult(topicName: string) {
    await this.topicResultLink(topicName).click();
  }
}
