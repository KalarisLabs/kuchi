/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
export interface Step<S extends string = string> {
  at: number;
  state: S;
  duration?: number;
}
