# CCState babel Preset

## Introduction

This is babel plugins for [CCState](https://github.com/e7h4n/ccstate). It helps CCState developers debug more easily:

- Hot Module Reload Support, adds a global cacheMap to make each atom a singleton, avoiding duplicate atom creation caused by HMR
- Automatically adds Debug Labels by using babel to automatically add debug information to each atom for easier debugging

## Installation

npm

```
npm install --dev ccstate-babel
```

yarn

```
yarn add -D ccstate-babel
```

pnpm

```typescript
pnpm add -D ccstate-babel
```

## Usage

```
// babel.config.json
{
  "presets": [["ccstate-babel/preset"]]
}

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: ['ccstate-babel/preset'],
      },
    }),
  ],
});
```

## Options

Options:

- `projectRoot`: The root directory of the project, this path will be used to filter out local environment information when generating debug information. default: `undefined`
- `customAtomNames`: Custom atom method names, method calls matching these names will generate debug information and support Hot Module Reload. default: `['state', 'computed', 'command']`

Pass a second argument to the preset to specify options.

```
// babel.config.json
{
  "presets": [["ccstate-babel/preset", { "customAtomNames": ["state", "computed", "command", "$action"] }]]
}

// vite.config.ts
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [['ccstate-babel/preset', { projectRoot: __dirname }]],
      },
    }),
  ],
});
```

## Changelog

[Changelog](CHANGELOG.md)

## Special Thanks

Thanks [Jotai](https://github.com/pmndrs/jotai). Without their work, this project would not exist.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
