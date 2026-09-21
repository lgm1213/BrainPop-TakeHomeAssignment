import path from 'path';

export const AUTH_STORAGE_STATE = path.resolve(__dirname, '../playwright/.auth/user.json');

// The shared BrainPOP test account's credentials (see .env.example). Read
// once here rather than each file that needs to log in reaching into
// process.env directly.

export const TEST_USERNAME = process.env.BRAINPOP_USERNAME!;
export const TEST_PASSWORD = process.env.BRAINPOP_PASSWORD!;

// The email address the account was registered with — distinct from its
// username. Used only to test the realistic mistake of typing your email
// instead of your BrainPOP username (BrainPOP logins are username-based,
// not email-based); this repo's own setup made exactly this mistake once.

export const TEST_EMAIL = process.env.BRAINPOP_EMAIL!;
