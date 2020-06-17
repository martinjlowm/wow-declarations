#!/usr/bin/env bash

export NODE_OPTIONS="$NODE_OPTIONS -r ts-node/register/transpile-only"

versions=$([[ -n "$1" ]] && echo "$1" || find ./mocks -not -path ./mocks -type d -exec basename {} \;)

for version in $versions; do
    echo "» Generating mocks for $version..."

    # NOTE: We do two passes instead of chaining transformers due to TypeScript's type
    # checker does not update its state between transformations.
    cat ./mocks/template.ts | sed -E "s/__version__/$version/" > mocks/$version/index.intermediate.ts

    ttsc -p mocks/tsconfig.env.json

    cat mocks/$version/index.intermediate.js | sed -E 's/^globalThis.([^ ]+) = createMock\(\);$/globalThis.\1 = createMock<typeof \1>\(\);/g' > mocks/$version/index.ts

    ttsc -p mocks/tsconfig.mock.json

    find ./mocks -mindepth 2 -not -name "index.js" -not -name ".gitkeep" -exec rm {} \;
done
