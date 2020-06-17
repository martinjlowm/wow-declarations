[![Build Status](https://github.com/martinjlowm/wow-declarations/workflows/ci/badge.svg)](https://travis-ci.org/wartoshika/wow-classic-declarations)

# TypeScript declarations the World of Warcraft LUA API

This is a fork of @wartoshika/wow-declarations.

**Supported transpilers for LUA targets**:
- qhun-transpiler ([GitHub-Page](https://github.com/wartoshika/qhun-transpiler))
- TypescriptToLua ([GitHub-Page](https://github.com/TypeScriptToLua/TypeScriptToLua)) - *Thanks to tstirrat*

## Setup

There's two steps to applying these declarations to your project:

1. Install `$ yarn add -D wow-declarations@martinjlowm/wow-declarations#master`

2. Add the declarations to the global scope by passing the `"types"` compiler
   option to TypeScript (`tsconfig.json`):

```js
{
    "compilerOptions": {
        "types": ["lua-types/jit", "@wartoshika/wow-declarations"]
    }
}
```

## Mocks

Global environment mocks (e.g. CreateFrame) are generated on installation and
may be imported in your tests as:

- Classic

```
import '@wartoshika/wow-declarations/mocks/1.13.x';
```

(The following aren't available just yet...)

- Classic TBC (if that becomes a reality - it's currently incomplete)

```
import '@wartoshika/wow-declarations/mocks/2.5.x';
```

- Retail

```
import '@wartoshika/wow-declarations/mocks/8.x';
```

- Shadowlands

```
import '@wartoshika/wow-declarations/mocks/9.x';
```


## Contribution

Feel free to contribute any corrections and additions to the list of
declarations. Fork and clone the repository and (assuming you are using Yarn in
your project) test out your changes locally by creating a Yarn portal from your
project:

```
yarn link <path-to-wow-declarations-project-directory>
```

If NPM is your preferred package manager, I assume `npm link` can accomplish the same.
