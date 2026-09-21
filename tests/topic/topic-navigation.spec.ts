import { test, expect, type Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { SearchBar } from '../../pages/SearchBar';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { BrowsePage } from '../../pages/BrowsePage';
import { TopicPage } from '../../pages/TopicPage';
import { AUTH_STORAGE_STATE } from '../constants';
import { ACCELERATION_FEATURES } from './features';

test.use({ storageState: AUTH_STORAGE_STATE });

async function browseToAcceleration(page: Page) {
  await new HomePage(page).goto();
  const browsePage = new BrowsePage(page);
  await browsePage.selectItem('Science');
  await browsePage.selectItem('Motions, Forces, and Time');
  await browsePage.selectItem('Acceleration');
}

/**
 * Part 2's task says to "navigate to a BrainPOP Topic page" — a real
 * student does that by searching or browsing, not by typing a URL. These
 * tests cover both realistic discovery paths; topic-feature.spec.ts then
 * uses a direct URL to reach a known topic quickly, since that spec is
 * testing feature selection specifically, not discovery.
 */

test.describe('Discovering a topic', () => {
  test('a student can find a topic by searching for it', async ({ page }) => {
    await new HomePage(page).goto();

    await new SearchBar(page).searchFor('Acceleration');

    await expect(page).toHaveURL(/\/search\?keyword=Acceleration/);

    await new SearchResultsPage(page).selectTopicResult('Acceleration');

    await expect(page).toHaveURL(/\/topic\/acceleration\//);
  });

  test('shows a no-results state for a search that matches nothing', async ({ page }) => {
    // No autocomplete suggestion appears for a query with zero matches
    // (confirmed live: the suggestion listbox stays at "0 items"), so this
    // submits via the Search button rather than SearchBar.searchFor(),
    // which waits to click a suggestion that will never appear.
    await new HomePage(page).goto();

    await new SearchBar(page).searchForWithNoExpectedSuggestion('asdkfjhaskdjfhqwerty');

    await expect(page).toHaveURL(/\/search\?keyword=asdkfjhaskdjfhqwerty/);
    await expect(new SearchResultsPage(page).noResultsMessage).toBeVisible();
  });

  test('a student can browse to a topic through Subject > Unit', async ({ page }) => {
    await new HomePage(page).goto();
    const browsePage = new BrowsePage(page);

    await browsePage.selectItem('Science');
    await expect(page).toHaveURL(/\/subject\/science\//);

    await browsePage.selectItem('Motions, Forces, and Time');
    await expect(page).toHaveURL(/\/unit\/motions-forces-and-time\//);

    await browsePage.selectItem('Acceleration');
    await expect(page).toHaveURL(/\/topic\/acceleration\//);
  });

  test('a student can browse to a topic through Subject > Topics (skipping Units)', async ({ page }) => {
    await new HomePage(page).goto();
    const browsePage = new BrowsePage(page);

    await browsePage.selectItem('Science');
    await expect(page).toHaveURL(/\/subject\/science\//);

    // A Subject page defaults to grouping topics under a Unit; switching to
    // its flat "Topics" list is a second, equally valid way to reach a
    // topic directly, without going through a Unit first. That list is
    // long (300+ topics, alphabetical) and renders progressively as the
    // page scrolls, so this picks "Acceleration" — the first entry,
    // guaranteed visible without scrolling — rather than building scroll
    // handling into the test for a page further down the alphabet.

    await browsePage.showAllTopics();
    await expect(page).toHaveURL(/\/subject\/science\/seeall/);

    await browsePage.selectItem('Acceleration');
    await expect(page).toHaveURL(/\/topic\/acceleration\//);
  });
});

/**
 * Discovery and feature selection composed into one flow: browse to a
 * topic the way a student actually would, then select a feature on it.
 * Data-driven over the same feature list topic-feature.spec.ts uses, so
 * this isn't a Quiz-only test — the same call works for any feature in
 * that list.
 *
 * Deliberately trimmed to two representative features rather than
 * looping all of ACCELERATION_FEATURES. What this describe block proves
 * is that BrowsePage and TopicPage *compose* — that real navigation can
 * feed into feature selection — and that only needs demonstrating once
 * (Quiz, the PDF's literal example) plus once more to show it isn't
 * Quiz-specific (Vocab Builder). Exhaustively re-selecting every feature
 * here, at full navigation cost each time, would just re-prove
 * generalization across features — already proven once, cheaply, by
 * topic-feature.spec.ts (no navigation overhead there). Covering more
 * features after real navigation is still a one-line change — add a name
 * to REPRESENTATIVE_FEATURES below — this is a deliberate simplicity
 * trade-off, not a limitation of the approach.
 */

const REPRESENTATIVE_FEATURES = ACCELERATION_FEATURES.filter(({ name }) =>
  ['Quiz', 'Vocab Builder'].includes(name)
);

test.describe('Browsing to a topic and selecting a feature on it', () => {
  for (const { name, slug } of REPRESENTATIVE_FEATURES) {
    test(`a student who browses to Acceleration can select the ${name} feature`, async ({ page }) => {
      await browseToAcceleration(page);
      await expect(page).toHaveURL(/\/topic\/acceleration\//);

      const topicPage = new TopicPage(page);
      await topicPage.selectFeature(name);
      await topicPage.expectNavigatedToFeature('acceleration', slug);
    });
  }
});
