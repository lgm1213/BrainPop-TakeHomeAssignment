# BrainPOP Automation Take-Home

Playwright + TypeScript suite covering the BrainPOP login flow (Part 1) and a
logged-in topic/feature flow (Part 2), per `I_I_QA_Automation_Take-Home_Test_v2.pdf`.

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # then fill in BRAINPOP_USERNAME / BRAINPOP_PASSWORD / BRAINPOP_EMAIL
```

The test account was created manually per the PDF's Setup step (not automated).
`BRAINPOP_EMAIL` is the address it was registered with (separate from the
username) — used by one negative login test.

`.env` is gitignored. CI (`.github/workflows/playwright.yml`) reads the same
three values from repository secrets.

## Running the suite

```bash
npm test              # full suite, all projects
npm run test:ui       # Playwright UI mode
npm run test:headed   # headed browser
npm run report        # open the last HTML report
```

Subset:

```bash
npx playwright test tests/login/login.spec.ts
npx playwright test --project=chromium tests/topic/
```

## Structure

```
pages/
  LoginPage.ts            login form
  AccountMenu.ts           authenticated header: Dashboard link, log out
  ForgotPasswordPage.ts    /password-reminder/ flow
  HomePage.ts              logged-in app homepage
  SearchBar.ts             header search widget
  SearchResultsPage.ts     /search results page
  BrowsePage.ts            Subject > Unit > Topic catalog browsing
  TopicPage.ts             a Topic page's feature tiles
tests/
  auth.setup.ts                  logs in once, saves storage state for reuse
  login/login.spec.ts             Part 1 — login/logout
  login/forgot-password.spec.ts   Part 1 — "Forgot username or password?"
  topic/features.ts               shared feature list, used by both topic specs
  topic/topic-navigation.spec.ts  Part 2 — discovering a topic (search/browse)
  topic/topic-feature.spec.ts     Part 2 — feature selection (data-driven)
```

Page objects hold locators/actions; tests express intent. Login is reusable
across the suite via `auth.setup.ts` + Playwright's `storageState` — other
specs opt in with `test.use({ storageState: AUTH_STORAGE_STATE })` instead of
re-driving the login UI. Feature selection (`TopicPage`) and catalog browsing
(`BrowsePage`) are similarly generic — reusable across any feature/topic, not
hardcoded to one.

## Coverage

**Login** (`login.spec.ts`): successful login (click and Enter-key submit),
logged-in state check, invalid credentials, email used as username, missing
username/password, Show Password toggle, Google/Clever OAuth (negative),
already-authenticated `/login/` redirect, logout.

**Forgot password** (`forgot-password.spec.ts`): navigation from login,
missing username, unknown username, valid username → email verification
(stops short of actually sending a reset email).

**Topic discovery** (`topic-navigation.spec.ts`): search (with and without
results), browse via Subject → Unit → Topic, browse via a Subject's flat
Topics list, and discovery composed with feature selection.

**Feature selection** (`topic-feature.spec.ts`): data-driven across every
feature tile on the reference topic, plus unauthenticated feature access
(shows a login prompt instead of navigating).

## Time spent

~3 hours total, across live exploration of the actual BrainPOP UI, the test
suite itself, and CI setup/debugging.
