import * as migration_20260706_033141_initial from './20260706_033141_initial';

export const migrations = [
  {
    up: migration_20260706_033141_initial.up,
    down: migration_20260706_033141_initial.down,
    name: '20260706_033141_initial'
  },
];
