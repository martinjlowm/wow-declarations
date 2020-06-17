import transformer from 'ts-auto-mock/transformer';
import { ConfigSet } from 'ts-jest/dist/config/config-set';

// NOTE: ts-jest has changed its interface with custom compiler (ttypescript)
// which have resulted in custom transformers being ignored in
// tsconfig.json. This factory wraps the ts-auto-mock transformer such that it
// complies with the built-in ts-jest AST transformers.
export const factory = (cs: ConfigSet) => {
  return transformer(cs.tsCompiler.program, {
    cacheBetweenTests: false,
    debug: true,
    features: ['overloads'],
  });
};
