## Project Overview

PR Monitor is a Chrome and Firefox browser extension that helps track incoming and outgoing pull requests on GitHub. The extension uses Manifest V3 and runs as a background service worker that periodically fetches PR data and displays it in a popup UI.

## Using Context7 for Documentation

When working with library-specific questions, use the Context7 MCP server to fetch current documentation. This ensures you have up-to-date API references and examples.

**Main library IDs for this project:**
- React: `/websites/react_dev`
- TypeScript: `/microsoft/typescript-website`
- MobX: `/mobxjs/mobx`
- Vitest: `/vitest-dev/vitest`
- Vite: `/vitejs/vite`
- Chrome Extensions (Manifest V3): `/websites/developer_chrome_extensions`
- Octokit (GitHub API): `/octokit/rest.js`
- GraphQL Request: `/onfido/graphql-request`

Use these library IDs when querying Context7 for API syntax, configuration, migration guides, or troubleshooting issues specific to these libraries.

## Development Commands

```bash
# Install dependencies
yarn install

# Start Vite dev server (popup UI; port 9000)
yarn start

# Watch TypeScript compilation (type checking)
yarn watch

# Build for production (outputs to dist/)
yarn build

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run a single test file
yarn vitest run src/path/to/file.spec.ts

# Lint code
yarn lint:check
yarn lint:fix
```

## Architecture

### Core Design Pattern: Interface-Implementation Separation

The codebase follows a strict separation between API interfaces and implementations:
- `*/api.ts` - defines the interface/contract for a module
- `*/implementation.ts` - provides the concrete implementation

This pattern enables dependency injection and makes testing easier by allowing fake implementations.

### Dependency Injection via Context

The `Context` interface (`environment/api.ts`) is the main dependency injection container that provides all services:
- `store` - Chrome storage wrapper
- `githubLoader` - fetches PR data from GitHub
- `notifier` - browser notifications
- `badger` - extension badge management
- `messenger` - cross-script messaging
- `tabOpener` - tab management

The context is constructed in `environment/implementation.ts` using `buildEnvironment()`.

### State Management with MobX

The `Core` class (`state/core.ts`) is the central MobX observable store that manages:
- Authentication token
- Loaded PR state
- Mute configuration
- Notification tracking
- Refresh status

MobX decorators (`@observable`, `@computed`) enable reactive updates to the UI.

### Two Entry Points

1. **Background Service Worker** (`src/background.ts`)
   - Runs continuously in the background
   - Refreshes PRs every 3 minutes via Chrome alarms
   - Handles extension install/update events
   - Listens for manual refresh requests via messaging

2. **Popup UI** (`src/popup.tsx`)
   - React application rendered in the extension popup
   - Uses the same `Core` state management
   - Displays filtered PR lists and settings

### Module Organization

- `badge/` - manages the extension badge counter
- `chrome/` - abstracts Chrome extension APIs
- `components/` - React components for the popup UI
- `environment/` - dependency injection context
- `filtering/` - PR filtering and categorization logic
- `github-api/` - GitHub REST/GraphQL API wrapper using Octokit
- `loading/` - orchestrates fetching PR data
- `messaging/` - enables communication between background and popup scripts
- `notifications/` - browser notification management
- `state/` - MobX state management (`Core` class)
- `storage/` - abstracts Chrome storage API
- `tabs/` - tab management for opening PRs
- `testing/` - shared test utilities and fakes

## Key Conventions

### TypeScript Configuration
- Strict mode enabled with all strict type-checking options
- `experimentalDecorators` enabled for MobX
- `useDefineForClassFields: false` so MobX `@observable` works with TypeScript class fields
- Test files (`*.spec.ts`) and `testing/` directories excluded from compilation

### Testing
- Vitest with `environment: "jsdom"` and globals enabled (`describe`, `it`, `expect`, `vi`, etc.)
- Test files use `.spec.ts` suffix
- Fakes/mocks organized in `testing/` subdirectories or `fake-*.ts` files
- Example: `chrome/fake-chrome.ts`, `environment/testing/fake.ts`

### Browser Extension Structure
- Uses Chrome Manifest V3
- Background script is a service worker (not persistent)
- Vite builds the service worker as a single `background.js` (`vite.background.config.ts`) and the popup from `index.html` (`vite.config.ts`)
- `manifest.json` at root defines permissions and entry points (`default_popup` is `index.html#popup`)

## GitHub Enterprise Support

To use with GitHub Enterprise, modify the `baseUrl` in the GitHub API configuration to point to your enterprise instance's API URL. See PR #769 for an example.

## Build Output

The `yarn build` command:
1. Removes `dist/` directory
2. Builds `background.js` (single ES module bundle for the MV3 worker) and copies `manifest.json` and `images/`
3. Builds the popup from `index.html` into `dist/index.html` plus hashed assets under `dist/assets/`
