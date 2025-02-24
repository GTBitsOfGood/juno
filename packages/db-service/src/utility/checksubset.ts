import { isEqual } from 'lodash';

export const isSubset = (subset, superset) =>
  subset.every((sub) => superset.some((superEl) => isEqual(sub, superEl)));
