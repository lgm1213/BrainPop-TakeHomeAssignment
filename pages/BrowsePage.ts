import { type Page, type Locator } from '@playwright/test';

/**
 * Generic wrapper for BrainPOP's catalog-browsing pages — the homepage's
 * Subjects list, a Subject page's Units list, and a Unit page's Topics
 * list all render the same "list of named links" structure, so one class
 * covers clicking through the whole Subject > Unit > Topic hierarchy the
 * way a student actually would, rather than jumping to a topic by URL.
 */

export class BrowsePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  itemLink(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  async selectItem(name: string) {
    await this.itemLink(name).click();
    await this.chooseClassicTopicsIfPromptedToExplore();
  }

  /**
   * A Subject page defaults to a "Units" view (topics grouped under a
   * Unit, e.g. Earth System). Its "Topics" toggle switches to a flat,
   * alphabetical list of every topic in that subject instead — a second,
   * equally valid way to reach a given topic without going through a Unit.
   */

  async showAllTopics() {
    await this.page.getByRole('button', { name: 'Topics', exact: true }).click();
  }

  /**
   * "Science" is ambiguous on BrainPOP: it's both a classic subject (the
   * topic hierarchy this class browses) and a separate "BrainPOP Science"
   * product. Clicking it opens a "What would you like to explore?" dialog
   * to disambiguate, instead of navigating directly. This suite is always
   * exercising classic topic browsing, so it always takes that branch; for
   * any other item (a Unit, a Topic) this dialog never appears and the
   * check below is a fast no-op.
   */
  
  private async chooseClassicTopicsIfPromptedToExplore() {
    const dialog = this.page.getByRole('dialog', { name: 'What would you like to explore?' });

    const appeared = await dialog
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (appeared) {
      await dialog.getByRole('link', { name: /topics on brainpop/i }).click();
    }
  }
}
