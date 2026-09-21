# BrainPOP Automation Take-Home

Playwright + TypeScript test suite covering the BrainPOP login flow (Part 1) and a
logged-in topic-feature flow (Part 2), per the take-home spec
(`I_I_QA_Automation_Take-Home_Test_v2.pdf`).

## Answering the take-home's reusability question

The spec's Part 1 asks for coverage beyond the minimum and to consider how
login would be structured for reuse in a larger suite. Short version:

- **Beyond the minimum 5 scenarios**, this suite also covers: the "Show
  password" checkbox actually toggling field visibility; Google/Clever
  OAuth sign-in negative paths (this account isn't linked to either); and
  the full "Forgot username or password?" flow. Each was chosen because it
  exercises a distinct, real failure/edge path, not just added for volume
  — see "Part 1 coverage" below for what each one asserts and why.
- **Reusable login** is two page objects plus one Playwright pattern:
  `LoginPage` owns the login *form* (locators, `login()`); `AccountMenu`
  owns authenticated *session state* (`Dashboard` link, `logOut()`) —
  separated so a test that just needs "am I logged in" doesn't need to
  know anything about the login form. `tests/auth.setup.ts` logs in once
  and persists storage state; any other spec opts in with one line
  (`test.use({ storageState: AUTH_STORAGE_STATE })`) and starts already
  authenticated, no UI login re-driven. `topic-feature.spec.ts` (Part 2)
  is the proof this works. Full detail in "How it's organized" below.

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # then fill in BRAINPOP_USERNAME / BRAINPOP_PASSWORD / BRAINPOP_EMAIL
```

The test account used for these tests was created manually per the PDF's Setup
step (Login → Enter Code → `ULONUQFL` → confirmed via email). That step is not
automated, per the instructions. `BRAINPOP_EMAIL` is the address you
registered with — separate from `BRAINPOP_USERNAME`, and used only by one
negative login test (see Part 1 coverage below).

`.env` is gitignored — never commit real credentials. `.env.example` holds
placeholders only. CI (`.github/workflows/playwright.yml`) reads the same
values from `BRAINPOP_USERNAME` / `BRAINPOP_PASSWORD` / `BRAINPOP_EMAIL`
repository secrets.

## Running the suite

```bash
npm test              # full suite, all projects (see "How it's organized")
npm run test:ui       # Playwright's UI mode
npm run test:headed   # headed browser
npm run report        # open the last HTML report
```

To run a subset:

```bash
npx playwright test tests/login/login.spec.ts
npx playwright test --project=chromium tests/topic/
```

## How it's organized

```
pages/
  LoginPage.ts          # login form: fill credentials, submit, read validation errors
  AccountMenu.ts         # authenticated header state: Dashboard link, account menu, log out
  ForgotPasswordPage.ts  # the /password-reminder/ flow reached from LoginPage
  HomePage.ts             # the logged-in app homepage
  SearchBar.ts            # header search widget: type a query, pick a suggestion
  SearchResultsPage.ts    # the /search?keyword=... results page
  BrowsePage.ts           # Subject > Unit > Topic catalog browsing, one click at a time
  TopicPage.ts           # a Topic page's feature tiles (Movie, Quiz, Vocab Builder, ...)
tests/
  auth.setup.ts                # logs in once via the UI, saves storage state for reuse
  login/login.spec.ts           # Part 1 — the login/logout flow itself
  login/forgot-password.spec.ts # Part 1 — the "Forgot username or password?" flow
  topic/features.ts              # shared { name, slug } list — Acceleration's feature
                                  # tiles — used by both topic specs below
  topic/topic-navigation.spec.ts # Part 2 — discovering a topic via search / browsing,
                                  # plus discovery composed with feature selection
  topic/topic-feature.spec.ts   # Part 2 — feature selection on a Topic page (data-driven)
```

**Page objects** encapsulate locators and low-level actions; tests express
intent (`loginPage.login(user, pass)`) rather than raw selectors. `LoginPage`
and `AccountMenu` are deliberately separate: the first is the login *form*,
the second is the authenticated *session state* (what any other test in a
larger suite would check or use to log out), so a test that only cares about
being logged in doesn't need to know anything about the login form.

**Reusable login for a larger suite.** Part 2's task explicitly needs to start
from a logged-in state without re-driving the login UI. This suite uses
Playwright's standard pattern for that: `tests/auth.setup.ts` runs once,
logs in through `LoginPage`, and persists the browser's storage state to
`playwright/.auth/user.json` (gitignored). Any other spec — like
`topic-feature.spec.ts` — opts into that state with a single line:

```ts
test.use({ storageState: AUTH_STORAGE_STATE });
```

That's the extension point for a larger suite: new logged-in-user tests reuse
this the same way, without duplicating the login flow.

**Reusable feature selection.** `TopicPage.selectFeature(name)` and
`expectNavigatedToFeature(topicSlug, featureSlug)` aren't Quiz-specific — the
spec covers both Quiz and Vocab Builder with the same two calls, demonstrating
the same approach extends to any feature tile on a Topic page.

**Reusable catalog browsing.** Similarly, `BrowsePage.selectItem(name)`
isn't specific to any one Subject, Unit, or Topic — the same call chains
through "Science" → "Motions, Forces, and Time" → "Acceleration" because
those pages all render the same link-list structure. See "Part 2 coverage
(topic-navigation.spec.ts)" below.

## A real constraint this suite works around

BrainPOP appears to enforce a single active session per account. Logging in
from a second browser context invalidates the first session. Since this
exercise uses one shared test account for everything, that has two
consequences reflected in the project structure (`playwright.config.ts`):

- **`login` is its own project, with no dependency on `setup`,** and its tests
  run serially (`test.describe.configure({ mode: 'serial' })`). Running the
  login/logout tests concurrently, or concurrently with `setup`'s own login,
  intermittently invalidated each other's sessions.
- **`setup` depends on `login`,** so it always logs in *after* Part 1's tests
  (including its own logout) have finished, guaranteeing the storage state it
  hands to Part 2 reflects a live, un-invalidated session.

In a suite with per-test or per-worker accounts this wouldn't be necessary —
noted here because it's a real, non-obvious constraint of the shared account
this exercise specifies, not a Playwright limitation.

## Part 1 coverage (`tests/login/login.spec.ts`)

- Successful login with valid credentials, and that the logged-in state is
  actually reflected in the UI (`Dashboard` link visible).
- The same successful login, submitted by pressing Enter in the password
  field instead of clicking Log In — a real, common way users submit forms
  that a click-only test never exercises.
- Invalid username/password → inline "did not match" error, stays on
  `/login/`.
- A real email address used as the username → the same "did not match"
  error. BrainPOP logins are username-based, not email-based — a realistic
  mistake for anyone used to email-based logins elsewhere, and one this
  suite's own setup made once (an email ended up in `.env` where the
  username belonged).
- Missing username, missing password, and missing both → the corresponding
  required-field validation, no submission.
- "Show password" checkbox toggles the password field between masked
  (`type="password"`) and plain text (`type="text"`), without losing the
  typed value, and reverts when unchecked.
- Google/Clever OAuth sign-in, negative coverage: this account was created
  via BrainPOP's Enter Code flow, not linked to either provider, so both are
  expected to fail. See "OAuth negative tests" below for what's actually
  asserted and why.
- Visiting `/login/` while already authenticated redirects away instead of
  showing the login form again.
- Logout → account menu → session ends (no `Dashboard` link) and a protected
  route (`/dashboard/`) bounces back to `/login/`.

## Part 1 coverage (`tests/login/forgot-password.spec.ts`)

The "Forgot username or password?" button leads to a separate page
(`/password-reminder/`) with its own two-step flow (username, then email
verification), so it gets its own page object (`ForgotPasswordPage`) and
spec file rather than being folded into `login.spec.ts`:

- Clicking the button from the login page navigates there and shows the
  "Reset Password" heading.
- Submitting with no username shows inline "Please enter your username."
  validation, no navigation.
- An unknown username shows "Sorry! We couldn't find an account with that
  username." and stays on the username step — this suite doesn't attempt
  to name that a security concern (it's BrainPOP's real, current behavior)
  but it is worth flagging in a real review: this response tells an
  attacker whether a given username exists (username enumeration).
- A real username correctly advances to the "Email Verification" step.
  **The test deliberately stops there** — actually submitting an email
  would trigger a real password-reset email to this account on every test
  run, which isn't something an automated suite should do to a real
  account. Reaching that step is enough to prove the account lookup and
  flow transition work.

## Part 2 coverage (`tests/topic/topic-navigation.spec.ts`)

The take-home's Part 2 says to "navigate to a BrainPOP Topic page." A real
student does that by searching or browsing — not by typing a URL — so this
is tested directly, as its own concern, separate from feature selection.
All of Part 2 (this file and `topic-feature.spec.ts`) uses "Acceleration"
as its one reference topic, reached a different way in each test, so a
reader can compare navigation methods without also tracking a different
topic name in each. (This file also composes discovery with feature
selection — see the last bullet below.)

- **Search**: type "Acceleration" into the header search box, pick the
  autocomplete suggestion (`/search?keyword=Acceleration`), then pick the
  matching result — lands on `/topic/acceleration/`.
- **Search, no results**: a query with no match shows no autocomplete
  suggestion at all (confirmed live: the suggestion listbox stays at
  "0 items") — so this submits via the visible Search button
  (`SearchBar.searchForWithNoExpectedSuggestion()`) instead of
  `searchFor()`, which would otherwise wait forever to click a suggestion
  that never appears. Lands on the results page showing "Topics
  (0 Results)" / "Try adjusting your search...".
- **Browse, through a Unit**: from the homepage's Subjects list, click
  "Science" → "Motions, Forces, and Time" (a Unit) → "Acceleration" (a
  Topic) — the same `BrowsePage.selectItem(name)` call at every level,
  since Subject, Unit, and Topic listing pages all share the same "list
  of named links" structure. Lands on `/topic/acceleration/`.
- **Browse, skipping Units**: a Subject page defaults to grouping topics
  under a Unit, but its "Topics" toggle switches to a flat, alphabetical
  list of every topic in that subject — "Science" → Topics tab →
  "Acceleration" directly, no Unit in between. A second, equally valid
  browse path, not a duplicate of the one above. That list is long (300+
  topics) and renders progressively as the page scrolls, so the test picks
  "Acceleration" — the alphabetically-first entry, guaranteed visible
  without scrolling — rather than a topic that would need scroll handling
  built into the test just to reach it.
- Clicking "Science" specifically opens a real disambiguation dialog
  ("What would you like to explore?" — BrainPOP Science product vs.
  classic topic browsing), not a random promo popup as it first appeared.
  `BrowsePage` always takes the classic-topics branch, since that's the
  journey this suite is exercising.
- **Browsing composed with feature selection**: a third describe block
  browses to Acceleration (Science → Motions, Forces, and Time →
  Acceleration) and then selects a feature on it — data-driven over
  `features.ts`, the same list `topic-feature.spec.ts` uses below, so this
  isn't a Quiz-only test.
  Deliberately trimmed to **two** representative features (Quiz — the
  PDF's literal example — and Vocab Builder, to show it isn't
  Quiz-specific) rather than looping the full list. `topic-feature.spec.ts`
  already proves feature selection generalizes across every entry in
  `features.ts`, cheaply (no navigation). What this describe block proves
  is a different claim — that `BrowsePage` and `TopicPage` *compose*, real
  navigation feeding into feature selection — and that only needs showing
  once, plus once more to rule out coincidence. Re-selecting every feature
  here at full navigation cost would just re-prove generalization the
  expensive way, something already proven once, cheaply, above. Covering
  a third feature after real navigation is still a one-line change (add
  its name to `REPRESENTATIVE_FEATURES` in the spec file) — this is a
  simplicity trade-off, not a limitation of the approach.

## Part 2 coverage (`tests/topic/topic-feature.spec.ts`)

- **Data-driven** from a shared list (`tests/topic/features.ts`), not
  copy-pasted tests with a hardcoded feature each — one test per
  `{ name, slug }` entry (currently Quiz, Vocab Builder, Creative Coding,
  Make-a-Movie, Worksheet, Graphic Organizer — every feature tile
  Acceleration actually has, except Movie). That list is shared with
  `topic-navigation.spec.ts`'s composed test above, so covering another
  feature — in isolation here, or after real navigation there — is one
  line in one file, not a change in two places. (Reading/"Connected Texts"
  is deliberately excluded — Acceleration doesn't have that feature tile;
  it's a Mountains-specific example from earlier exploration that doesn't
  apply to this topic.)
- Each generated test selects its feature on the Acceleration topic and
  confirms it navigates to `/topic/acceleration/{slug}/` — e.g. Quiz →
  `/topic/acceleration/quiz/`, Vocab Builder →
  `/topic/acceleration/vocab-builder/`.
- Reaches the topic via `TopicPage.goto('acceleration')` — a direct URL —
  deliberately: this spec's job is proving feature selection generalizes
  across *every* feature, cheaply; the composed test above proves real
  navigation feeds into it correctly, for a representative couple. Two
  different claims, kept in two places, so a failure's cause stays
  unambiguous — if discovery breaks, `topic-navigation.spec.ts`'s
  discovery tests fail; if a specific feature's selection breaks, this
  file names exactly which one, and the composed test above would also
  fail for it if that feature happens to be one of the two it covers.
  `TopicPage.goto()` is also, not incidentally, the only place a direct
  URL entry point to a topic gets exercised at all — the kind of shortcut
  any future test that needs to land on a known topic, without re-running
  discovery, would reuse.
- **Feature access while logged out**: a separate describe block
  (overriding `storageState` back to unauthenticated) selects Quiz without
  ever logging in first, and confirms BrainPOP shows "Please log in to
  continue." instead of navigating to `/topic/acceleration/quiz/`. Topic
  pages themselves are public; the take-home's own Part 1 intro notes some
  functionality still requires login — a feature tile is exactly that
  boundary. `TopicPage.loginRequiredModal` was defined early on, during
  this suite's first live exploration of the site (logged out, before
  login even worked), but had no test using it until now.

## OAuth negative tests

This test account can't sign in via Google or Clever — it was created
through BrainPOP's Enter Code flow, not linked to either provider. For
Google specifically there are really three distinct real-world scenarios
worth naming, since "the OAuth login fails" isn't one behavior:

1. **No Google session at all** (a fresh browser, or an automated test
   context) — clicking "Sign in with Google" hands off to Google's own
   login page, since Google has no session to make a decision with. This is
   what a brand-new user, or this suite's automated run, actually hits.
2. **A Google session exists, but that Google account isn't linked to any
   BrainPOP account** — Google skips its login form (it already knows who
   you are) and redirects straight back to BrainPOP, which then rejects the
   handoff. This is the realistic "student with an unlinked Gmail" case.
3. **A Google session exists and *is* linked/enabled for this BrainPOP
   account** — the success path. Out of scope here; this take-home's test
   account isn't linked to Google, and setting up that linkage isn't part
   of the assignment.

What's actually implemented and why:

- **Scenario 1 is what the automated Google test covers**
  (`hands off to Google for OAuth sign-in`): it asserts BrainPOP correctly
  redirects to Google's real OAuth endpoint with the right callback URL
  registered — the one thing reliably verifiable without real credentials.
- **Scenario 2 was attempted and is a documented gap, not an oversight.**
  The plan was to manually log into a real, unlinked personal Google
  account in a Playwright-launched browser (a real human typing real
  credentials, once, to capture a reusable session — the same pattern
  `tests/auth.setup.ts` already uses for BrainPOP itself) and reuse that
  session in an automated test. Google's sign-in page refused it: **Google
  detects the browser as automated and blocks the sign-in outright**, even
  for a real person typing real credentials — this isn't about scripting
  keystrokes, it's Google fingerprinting the browser environment itself
  (`navigator.webdriver` and similar signals). No further workaround was
  attempted; bypassing that kind of detection isn't something to spend
  effort on. In a real org, this is solved differently: a dedicated
  non-personal Google test account (not a teammate's personal email),
  provisioned through channels that don't trip consumer sign-in
  protections (e.g. Google Workspace admin-managed test users, or an
  organization's existing exemption/allowlist for its own QA automation).
  That infrastructure doesn't exist for a take-home exercise. Manually
  confirmed (outside of any automated test) that BrainPOP's actual
  rejection for this scenario lands on `/login/?error=google-sso-error`
  ("Can't Sign in With Google") — noted here so a future attempt with a
  proper test account knows what to assert.
- **Scenario 3 is out of scope**, per above.

**Clever** doesn't have this same three-way split, and gets a stronger
test as a result (`hands off to Clever for OAuth, and rejects a callback
with no valid authorization`): it asserts the redirect leg (button →
`clever.com/oauth/...`), *plus* a real negative-path assertion. Clever's
callback endpoint (`api.brainpop.com/api/clevercallback/bp/en`) is
BrainPOP's own server, not Clever's — hitting it directly with no
authorization code (what an unlinked/failed Clever handshake produces) is
a legitimate way to exercise BrainPOP's own failure handling, and reliably
lands on `/login/?error=error-generating-token` ("Can't Sign in With
Clever"). This doesn't drive Clever's hosted login UI, but it does verify
the part of the flow BrainPOP actually owns.

## Notes / trade-offs

- The PDF describes a login *modal*; the live site currently serves a
  dedicated `/login/` page instead. Tests were written against the live
  behavior observed during this exercise.
- Locators favor accessible roles/names (`getByRole`) over CSS/XPath, since
  BrainPOP's markup includes generated class names (Wix-based marketing
  pages). Two exceptions: the account-menu button, whose accessible name is
  the user's first name — located structurally (the nav list containing the
  `Dashboard` link) instead of being hardcoded; and the "Show password"
  checkbox, whose actual `<input>` is visually hidden behind a styled
  wrapper that intercepts clicks — `LoginPage` clicks the visible label text
  instead, and keeps a separate role-based locator purely for reading
  checked state.
- `tsconfig.json` and the `typescript` dev dependency are included purely for
  standalone type-checking (`npx tsc --noEmit`); Playwright's runner
  transpiles tests on its own and doesn't require either.

## Time spent

~2.5 hours, including live exploration of the actual BrainPOP UI (the PDF's
described flows didn't fully match production) and chasing down the
session-invalidation issue above.
