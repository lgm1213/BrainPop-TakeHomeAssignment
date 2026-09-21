import { test, expect } from '@playwright/test';
import { TopicPage } from '../../pages/TopicPage';
import { AUTH_STORAGE_STATE } from '../constants';
import { ACCELERATION_FEATURES } from './features';

test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * Data-driven, not several copy-pasted tests with a hardcoded feature
 * each: the point is that TopicPage.selectFeature/expectNavigatedToFeature
 * work for any feature on a Topic page. Covering another one is a line in
 * features.ts, not a new test to write.
 */

test.describe('Topic page features', () => {
  for (const { name, slug } of ACCELERATION_FEATURES) {
    test(`selecting the ${name} feature navigates to the topic ${slug} page`, async ({ page }) => {
      const topicPage = new TopicPage(page);
      await topicPage.goto('acceleration');

      await topicPage.selectFeature(name);

      await topicPage.expectNavigatedToFeature('acceleration', slug);
    });
  }
});

test.describe('Feature access without being logged in', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows a login prompt instead of navigating to a feature', async ({ page }) => {
    
    // Topic pages themselves are public; the PDF's Part 1 intro notes some
    // functionality still requires login — a feature tile is exactly that
    // boundary. TopicPage.loginRequiredModal was defined early on, while
    // first exploring the site logged out, but never had a test using it
    // until now.
    
    const topicPage = new TopicPage(page);
    await topicPage.goto('acceleration');

    await topicPage.selectFeature('Quiz');

    await expect(topicPage.loginRequiredModal).toBeVisible();
    await expect(page).not.toHaveURL(/\/topic\/acceleration\/quiz\//);
  });
});
