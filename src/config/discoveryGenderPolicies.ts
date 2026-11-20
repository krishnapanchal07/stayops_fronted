import type { DiscoveryGender } from '@/types/discovery';

/** Demonstration policies for the public mock experience, not confirmed property rules. */
export const discoveryGenderPolicies: Readonly<Record<string, DiscoveryGender>> = {
  'prop-sunrise': 'male',
  'prop-greenview': 'female',
  'prop-oak': 'male',
  'prop-lake': 'unisex',
  'prop-maple': 'female',
  'prop-horizon': 'unisex',
  'prop-palm': 'unisex',
};
