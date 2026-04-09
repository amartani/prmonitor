## Project Overview

PR Monitor is a Chrome and Firefox browser extension that helps track incoming and outgoing pull requests on GitHub. The extension uses Manifest V3 and runs as a background service worker that periodically fetches PR data and displays it in a popup UI.

## Development Commands

```bash
# Install dependencies
yarn install

# Start webpack dev server
yarn start

# Watch TypeScript compilation (type checking)
yarn watch

# Build for production (outputs to dist/)
yarn build

# Run tests
yarn test

# Run specific test file
yarn test src/path/to/file.spec.ts

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
- Test files (`*.spec.ts`) and `testing/` directories excluded from compilation

### Testing
- Jest with `ts-jest` preset
- Test files use `.spec.ts` suffix
- Fakes/mocks organized in `testing/` subdirectories or `fake-*.ts` files
- Example: `chrome/fake-chrome.ts`, `environment/testing/fake.ts`

### Browser Extension Structure
- Uses Chrome Manifest V3
- Background script is a service worker (not persistent)
- Webpack bundles `background.ts` and `popup.tsx` separately
- `manifest.json` at root defines permissions and entry points

## GitHub Enterprise Support

To use with GitHub Enterprise, modify the `baseUrl` in the GitHub API configuration to point to your enterprise instance's API URL. See PR #769 for an example.

## Build Output

The `yarn build` command:
1. Removes `dist/` directory
2. Runs Webpack in production mode
3. Bundles `background.js` and `popup.js`
4. Copies `manifest.json` and `images/` to `dist/`
5. Generates `index.html` from `src/popup.html` template
