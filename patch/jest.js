const config = require('jest-config');

config.constants.JEST_CONFIG_EXT_ORDER = Object.freeze([
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.ts',
]);
