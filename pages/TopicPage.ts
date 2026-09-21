import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Represents a BrainPOP Topic page (e.g. /topic/acceleration/).
 * Feature tiles (Movie, Quiz, Vocab Builder, ...) share a consistent
 * list-item/link structure, so selecting one is exposed as a single
 * reusable method rather than one method per feature.
 */

export class TopicPage {
  readonly page: Page;
  readonly featureList: Locator;
  readonly loginRequiredModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.featureList = page.getByRole('list').filter({ has: page.getByRole('link', { name: 'Movie' }) });
    this.loginRequiredModal = page.getByRole('dialog').filter({ hasText: 'Please log in to continue.' });
  }

  async goto(topicSlug: string) {
    await this.page.goto(`/topic/${topicSlug}/`);
  }

  featureLink(featureName: string): Locator {
    return this.featureList.getByRole('link', { name: new RegExp(featureName, 'i') });
  }

  async selectFeature(featureName: string) {
    await this.featureLink(featureName).click();
  }

  /**
   * Asserts that selecting a feature navigated to its dedicated page,
   * whose URL follows the /topic/{slug}/{feature-slug}/ convention.
   */
  
  async expectNavigatedToFeature(topicSlug: string, featureSlug: string) {
    await expect(this.page).toHaveURL(new RegExp(`/topic/${topicSlug}/${featureSlug}/`));
  }
}
