# PR Monitor Chrome Extension - Modernization Plan

## Context

PR Monitor is an abandoned Chrome/Firefox extension for tracking GitHub pull requests. It uses Manifest V3 and was last actively developed around 2022. The codebase is functional but uses several outdated dependencies and patterns.

**Why modernize?** Even for an abandoned project, modernization provides:
- **Security**: Updated dependencies fix known vulnerabilities
- **Bundle size**: Removing Moment.js saves ~50KB
- **Performance**: TypeScript 5 compiles faster, Vite would be faster than Webpack
- **Maintainability**: Modern patterns make future changes easier

**Current tech stack (post-modernization):**
- TypeScript 5.x
- React 18 with `createRoot`
- MobX 6 with decorators
- Vite 6 (popup + separate single-file background build)
- Vitest 3 with jsdom
- Moment.js 2.29.4 (deprecated, used only once for `.fromNow()`)
- @octokit/rest 19 (outdated, v21+ is current)

**Test coverage:** 2,149 lines across 6 test files, strong coverage of state management and filtering logic (no React component tests).

## Strategy

This plan prioritizes **incremental, low-risk changes** that can be verified after each phase. We'll avoid risky rewrites (like MobX → Zustand) and focus on practical improvements.

---

## Phase 1: Quick Wins (Low Risk, 1-2 hours)

### 1.1 Replace Moment.js with Native Date Formatting

**Why**: Moment.js is 67KB minified and officially deprecated. It's used only once in the entire codebase.

**Risk**: LOW | **Effort**: 15 minutes

**Changes:**

1. **Remove Moment.js dependency**
   - File: `package.json` line 19
   - Remove: `"moment": "^2.29.4"`

2. **Replace Moment.js usage**
   - File: `src/components/Status.tsx`
   - Line 3: Remove `import moment from "moment";`
   - Line 23: Replace `moment(props.core.loadedState.startRefreshTimestamp).fromNow()` with custom function

3. **Add time formatting helper** (two options):

   **Option A: Native implementation** (zero dependencies):
   ```typescript
   function formatTimeAgo(timestamp: number): string {
     const seconds = Math.floor((Date.now() - timestamp) / 1000);
     
     if (seconds < 60) return 'just now';
     const minutes = Math.floor(seconds / 60);
     if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
     const hours = Math.floor(minutes / 60);
     if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
     const days = Math.floor(hours / 24);
     return `${days} day${days !== 1 ? 's' : ''} ago`;
   }
   ```

   **Option B: Use date-fns** (1-2KB with tree-shaking):
   ```typescript
   import { formatDistanceToNow } from 'date-fns';
   
   // Usage:
   formatDistanceToNow(timestamp, { addSuffix: true })
   ```

4. **Remove Webpack Moment optimization**
   - File: `webpack.config.js` lines 61-64
   - Remove the `webpack.IgnorePlugin` for moment locales (no longer needed)

**Verification:**
```bash
yarn build
yarn test
# Load extension in Chrome, check "Last updated X minutes ago" displays correctly
du -h dist/popup.js  # Should be ~50KB smaller
```

---

### 1.2 Fix Deprecated ESLint Rule

**Why**: `@typescript-eslint/camelcase` was removed in v5, causing warnings.

**Risk**: LOW | **Effort**: 2 minutes

**Changes:**
- File: `.eslintrc.js` line 17
- Remove: `"@typescript-eslint/camelcase": "off",`
- (No replacement needed, the rule no longer exists)

**Verification:**
```bash
yarn lint:check  # Should pass with no deprecated warnings
```

---

### 1.3 Fix Jest Test Environment

**Why**: Test environment is set to "node" but best practice for React projects is "jsdom".

**Risk**: LOW | **Effort**: 2 minutes

**Changes:**
- File: `jest.config.js` line 3
- Change: `testEnvironment: "node"` → `testEnvironment: "jsdom"`

**Note**: Current tests are unit tests for state/filtering logic (no React component tests), so they work in node environment. This change is for future-proofing if React component tests are added.

**Verification:**
```bash
yarn test  # All tests should still pass
```

---

### 1.4 Update ESLint ecmaVersion

**Why**: ESLint is configured for ES2018 but TypeScript targets ES2020. Update for consistency.

**Risk**: LOW | **Effort**: 2 minutes

**Changes:**
- File: `.eslintrc.js` line 9
- Change: `ecmaVersion: 2018` → `ecmaVersion: 2020`

**Verification:**
```bash
yarn lint:check  # Should pass
```

---

## Phase 2: TypeScript & React Modernization (Medium Risk, 2-3 hours)

### 2.1 Upgrade TypeScript to 5.x + Modern JSX Transform

**Why**: TypeScript 5.x has better performance, improved type checking, and supports automatic JSX transform (no need to import React in every component).

**Risk**: MEDIUM | **Effort**: 2 hours

**Changes:**

1. **Update TypeScript version**
   - File: `package.json` line 49
   - Change: `"typescript": "^4.7.4"` → `"typescript": "^5.7.0"`

2. **Enable new JSX transform**
   - File: `tsconfig.json` line 9
   - Change: `"jsx": "react"` → `"jsx": "react-jsx"`

3. **Remove unnecessary React imports** (11 files affected):
   
   **Keep React import in:**
   - `src/popup.tsx` (uses ReactDOM)
   
   **Modify to import only hooks:**
   - `src/components/Settings.tsx` → `import { useState, useRef, FormEvent } from "react";`
   - `src/components/WhitelistedTeams.tsx` → `import { useState, useRef, FormEvent } from "react";`
   - `src/components/Popup.tsx` → `import { useState } from "react";`
   
   **Remove React import entirely:**
   - `src/components/Loader.tsx`
   - `src/components/IgnoredRepositories.tsx`
   - `src/components/PullRequestItem.tsx`
   - `src/components/PullRequestStatus.tsx`
   - `src/components/PullRequestList.tsx`
   - `src/components/Status.tsx`
   - `src/components/NewCommitsToggle.tsx`

**Verification:**
```bash
yarn build  # Should pass with no errors
yarn test   # All tests should pass
yarn lint:check  # Should pass
# Load extension in Chrome, test all UI interactions
time yarn build  # Check if compilation is faster
```

---

### 2.2 Upgrade React API to createRoot()

**Why**: `ReactDOM.render()` is deprecated in React 18 and removed in React 19. Using `createRoot()` enables Concurrent Features.

**Risk**: LOW | **Effort**: 10 minutes

**Changes:**
- File: `src/popup.tsx`
  - Line 13: Change `import ReactDOM from "react-dom"` → `import { createRoot } from "react-dom/client"`
  - Lines 79-85: Replace render call

**Before:**
```typescript
ReactDOM.render(
  <>
    <Global styles={css(globalCssTemplates)} />
    <Popup core={core} />
  </>,
  document.getElementById("root")
);
```

**After:**
```typescript
const root = createRoot(document.getElementById("root")!);
root.render(
  <>
    <Global styles={css(globalCssTemplates)} />
    <Popup core={core} />
  </>
);
```

**Verification:**
```bash
yarn build
yarn test
# Load extension in Chrome, verify popup opens and renders correctly
# Test refresh, mute/unmute, settings changes
```

---

## Phase 3: Build Tooling Improvements (Low Risk, 30 minutes)

### 3.1 Update Type Definitions

**Why**: Type definitions should match runtime versions for better type safety.

**Risk**: LOW | **Effort**: 5 minutes

**Changes:**
- File: `package.json`
  - Line 32: `"@types/react": "^18.0.17"` → `"@types/react": "^18.3.0"`
  - Line 33: `"@types/react-dom": "^18.0.6"` → `"@types/react-dom": "^18.3.0"`

**Verification:**
```bash
yarn install
yarn build  # Should pass with better type checking
```

---

### 3.2 Remove Unused babel-loader Configuration

**Why**: Webpack config includes babel-loader for `.js` files, but there are no `.js` files in src/. This is dead code.

**Risk**: LOW | **Effort**: 2 minutes

**Changes:**
- File: `webpack.config.js` lines 11-15
- Remove the entire babel-loader rule block

**Verification:**
```bash
find src -name "*.js" -type f  # Should return nothing
yarn build  # Should pass
```

---

## Phase 4: Dependency Updates (Medium Risk, 1-2 hours)

### 4.1 Update Octokit Packages

**Why**: Stay current with GitHub API client for bug fixes and new features.

**Risk**: MEDIUM | **Effort**: 1 hour

**Changes:**
- File: `package.json`
  - Line 9: `"@octokit/plugin-throttling": "^4.3.2"` → `"@octokit/plugin-throttling": "^9.3.0"`
  - Line 10: `"@octokit/rest": "^19.0.4"` → `"@octokit/rest": "^21.0.0"`

**Potential breaking changes:**
- Review @octokit/rest v20 and v21 changelogs before updating
- May need to update `src/github-api/implementation.ts` if API signatures changed
- Test thoroughly: PR fetching, review status, notifications

**Verification:**
```bash
yarn install
yarn build  # Check for type errors
yarn test  # All tests should pass
# Load extension, connect GitHub token, fetch PRs
# Test review status detection, notifications
```

---

### 4.2 Update React Bootstrap

**Why**: Bug fixes and better React 18 compatibility.

**Risk**: LOW | **Effort**: 5 minutes

**Changes:**
- File: `package.json` line 21
- Change: `"react-bootstrap": "^2.5.0"` → `"react-bootstrap": "^2.10.0"`

**Verification:**
```bash
yarn install
yarn build
# Load extension, test all UI components (tabs, dropdowns, alerts, badges)
```

---

### 4.3 Update ESLint Ecosystem

**Why**: Bug fixes and compatibility with TypeScript 5.

**Risk**: LOW | **Effort**: 15 minutes

**Changes:**
- File: `package.json`
  - Line 34: `"@typescript-eslint/eslint-plugin": "^5.34.0"` → `"@typescript-eslint/eslint-plugin": "^8.0.0"`
  - Line 35: `"@typescript-eslint/parser": "^5.34.0"` → `"@typescript-eslint/parser": "^8.0.0"`
  - Line 42: `"eslint-plugin-react": "^7.30.1"` → `"eslint-plugin-react": "^7.37.0"`

**Note**: Consider keeping ESLint at 8.x instead of upgrading to 9.x (which uses flat config format).

**Verification:**
```bash
yarn install
yarn lint:check  # Should pass
# Fix any new warnings that appear
```

---

## Phase 5: Optional Advanced Improvements

### 5.1 Migrate from Webpack to Vite (DONE)

**Implementation:** Two-step production build: `vite build --config vite.background.config.ts` emits a single `background.js` (MV3 service worker, `inlineDynamicImports`) plus copied `manifest.json` and `images/`; then `vite build` emits `index.html` and hashed assets with `base: './'` for `chrome-extension://` URLs. Dev server uses root `index.html` and `src/popup.tsx`.

---

### 5.2 Migrate from Jest to Vitest (DONE)

**Implementation:** `vitest` config in `vite.config.ts` (`globals`, `environment: 'jsdom'`). Mocks use `vi` from `vitest`; `src/testing/mocked.ts` types mocks with Vitest `Mock`.

---

### 5.3 Migrate MobX Decorators to makeAutoObservable (OPTIONAL)

**Why**: Modern MobX approach that doesn't require `experimentalDecorators` flag.

**Risk**: MEDIUM | **Effort**: 30 minutes

**Changes:**
- File: `src/state/core.ts`
  - Lines 25-31: Remove `@observable` decorators from properties
  - Lines 177, 191, 198: Remove `@computed` decorators from getters
  - Line 34: Change `makeObservable(this)` → `makeAutoObservable(this)`

**Recommendation**: **Optional**. Only do this if you want to remove `experimentalDecorators` from tsconfig. Current decorator pattern works fine.

---

## Critical Files Reference

The following files will be modified during implementation:

**Phase 1:**
- `src/components/Status.tsx` (Moment.js removal)
- `package.json` (Remove moment dependency)
- `webpack.config.js` (Remove moment plugin)
- `.eslintrc.js` (Fix deprecated rule, update ecmaVersion)
- `jest.config.js` (Fix test environment)

**Phase 2:**
- `package.json` (TypeScript upgrade)
- `tsconfig.json` (JSX transform)
- All 11 component files in `src/components/` (React imports)
- `src/popup.tsx` (createRoot API)

**Phase 3:**
- `package.json` (@types updates)
- `webpack.config.js` (Remove babel-loader)

**Phase 4:**
- `package.json` (Octokit, React Bootstrap, ESLint updates)
- Possibly `src/github-api/implementation.ts` (if Octokit API changed)

---

## Expected Outcomes

**After Phase 1:**
- ✅ Bundle size reduced by ~50KB (moment.js removed)
- ✅ No ESLint warnings
- ✅ Proper test environment configured
- ⏱️ Time: 1-2 hours | Risk: Minimal

**After Phase 2:**
- ✅ Modern TypeScript 5.x with better performance
- ✅ Cleaner code (no unnecessary React imports)
- ✅ React 18 concurrent features enabled
- ⏱️ Time: 2-3 hours | Risk: Low-Medium

**After Phase 3:**
- ✅ Better type safety
- ✅ Cleaner webpack config
- ⏱️ Time: 30 minutes | Risk: Minimal

**After Phase 4:**
- ✅ Up-to-date dependencies
- ✅ Security patches and bug fixes
- ⏱️ Time: 1-2 hours | Risk: Medium

**Total effort**: 5-8 hours for all phases
**Total risk**: Low-Medium with proper testing

---

## Verification Strategy

After each phase:

1. **Build verification**: `yarn build` (should pass with no errors)
2. **Test verification**: `yarn test` (all tests should pass)
3. **Lint verification**: `yarn lint:check` (should pass with no warnings)
4. **Manual testing**: Load extension in Chrome, test all features:
   - Connect GitHub token
   - Fetch pull requests
   - View PR lists (incoming/outgoing)
   - Test mute/unmute functionality
   - Test settings changes
   - Verify notifications work
   - Check badge counter
5. **Bundle size check**: `du -h dist/` (monitor for size changes)
6. **CI verification**: Ensure GitHub Actions pass

**Git workflow**: Commit after each phase for easy rollback if needed.

---

## Implementation progress

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | Done | Moment removed; `src/format-time-ago.ts` + tests; webpack `IgnorePlugin` for moment removed; unused `webpack` require removed; `jest-environment-jsdom` for `testEnvironment: "jsdom"`; removed deprecated `@typescript-eslint/camelcase`; `ecmaVersion` 2020 |
| Phase 2 | Done | TypeScript `^5.7.0`; `jsx: "react-jsx"`; components use automatic JSX (hooks-only imports where needed); `popup.tsx` uses `createRoot` from `react-dom/client` with null check for `#root` |
| Phase 3 | Done | `@types/react` / `@types/react-dom` `^18.3.0`; babel-loader rule removed from `webpack.config.js` |
| Phase 4 | Done | `@octokit/core` `^6.1.4` (peer for throttling); `@octokit/rest` `^21`, `@octokit/plugin-throttling` `^9`; `PaginationResults` type local in `github-api/api.ts` (avoids broken paginate-rest subpath); throttle callbacks untyped for LimitHandler compatibility; `react-bootstrap` `^2.10`; ESLint `^8.57`, `@typescript-eslint` `^8`, `eslint-config-prettier` `^9`, `eslint-plugin-react` `^7.37`; extends `plugin:react/jsx-runtime` |
| Phase 5 | Done | Vite (`vite.config.ts`, `vite.background.config.ts`, root `index.html`); Vitest; Webpack/Jest removed; `tsconfig` `useDefineForClassFields: false` for MobX |

**Verification (latest):** `yarn test`, `yarn build`, and `yarn lint:check` all pass.

---

## Success Criteria

This modernization is successful if:
- ✅ All tests pass
- ✅ Extension loads and functions correctly
- ✅ Bundle size is reduced (Phase 1)
- ✅ Build time is improved (Phase 2)
- ✅ No deprecated dependencies remain
- ✅ TypeScript compilation has no errors
- ✅ ESLint runs with no warnings
- ✅ GitHub Actions CI passes
