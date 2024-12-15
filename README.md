# Rippling

[![Coverage Status](https://coveralls.io/repos/github/e7h4n/rippling/badge.svg?branch=main)](https://coveralls.io/github/e7h4n/rippling?branch=main)
![NPM Type Definitions](https://img.shields.io/npm/types/rippling)
![NPM Version](https://img.shields.io/npm/v/rippling)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/rippling)
[![CI](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml/badge.svg)](https://github.com/e7h4n/rippling/actions/workflows/ci.yaml)
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/e7h4n/rippling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Documentation

- [Getting Started](docs/getting-started.md)
- [Basic](docs/basic.md)
- [Using in React](docs/react.md)
- (TBD) [Debug Rippling](docs/devtools.md)
- [Testing](docs/testing.md)
- [Concept behind Rippling](docs/concept.md)

## Changelog & TODO

[Changelog](packages/rippling/CHANGELOG.md)

Here are some new ideas:

- Integration with svelte / solid.js
- Enhance devtools
  - Support viewing current subscription graph and related atom values
  - Enable logging and breakpoints for specific atoms in devtools
- Performance improvements
  - Mount atomState directly on atoms when there's only one store in the application to reduce WeakMap lookup overhead
  - Support static declaration of upstream dependencies for Computed to improve performance by disabling runtime dependency analysis

## Contributing

Rippling welcomes any suggestions and Pull Requests. If you're interested in improving Rippling, here are some basic steps to help you set up a Rippling development environment.

```bash
pnpm install
pnpm husky # setup commit hooks to verify commit
pnpm vitest # to run all tests
pnpm lint # check code style & typing
```

## Special Thanks

Thanks [Jotai](https://github.com/pmndrs/jotai) for the inspiration and some code snippets, especially the test cases. Without their work, this project would not exist.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
