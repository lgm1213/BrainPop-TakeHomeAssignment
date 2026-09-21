/**
 * Feature tiles that exist on the Acceleration topic page (the one
 * reference topic Part 2 uses throughout). Shared between
 * topic-feature.spec.ts (feature selection tested in isolation, reached
 * by a direct URL) and topic-navigation.spec.ts (feature selection
 * chained after real navigation) so both stay in sync — covering another
 * feature is a one-line addition here, not a change in two places.
 *
 * "Connected Texts" (Reading) is deliberately not included — it's not one
 * of Acceleration's feature tiles (that's a Reading unit specific to
 * certain topics, e.g. Mountains). Only list features the topic under
 * test actually has.
 */

export const ACCELERATION_FEATURES = [
  { name: 'Quiz', slug: 'quiz' },
  { name: 'Vocab Builder', slug: 'vocab-builder' },
  { name: 'Creative Coding', slug: 'coding' },
  { name: 'Make-a-Movie', slug: 'make-a-movie' },
  { name: 'Worksheet', slug: 'worksheet' },
  { name: 'Graphic Organizer', slug: 'graphic-organizer' },
];
