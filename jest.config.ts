module.exports = {
  setupFiles: [
    '<rootDir>/test/config.ts'
  ],
  transform: {
    '.(ts|tsx)': 'ts-jest'
  },
  testRegex: '.+\\.spec\\.tsx?$',
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
  ],
  globals: {
    'ts-jest': {
      packageJson: '<rootDir>/package.json',
      compiler: 'typescript',
      astTransformers: ['./transformers/ts-auto-mock'],
      tsConfig: './test/tsconfig.json',
    }
  },
};
