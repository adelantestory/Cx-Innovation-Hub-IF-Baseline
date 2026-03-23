# GitHub Actions PR Quality Gate Setup

## Overview

This document explains how to enable the PR Quality Gate workflow as a required status check for the `main` branch.

## What the Workflow Does

The `pr-quality-gate.yml` workflow automatically runs on all pull requests targeting the `main` branch and validates:

- ✅ **Build**: Compiles TypeScript and builds the React application (`npm run build`)
- ✅ **Linting**: Checks code style and quality with ESLint (`npm run lint`)
- ✅ **Tests**: Runs unit tests with Vitest (`npm test`)
- 📊 **Coverage**: Generates test coverage report and posts summary to PR (non-blocking)

## Enabling Branch Protection Rules

To make the quality gate workflow **required** and prevent merging PRs that fail checks:

### Step 1: Go to Branch Protection Settings

1. Navigate to your GitHub repository
2. Go to **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**

### Step 2: Configure the Rule

1. **Branch name pattern**: Enter `main`
2. **Require status checks to pass before merging**: ✅ Check this box
3. **Require branches to be up to date before merging**: ✅ Recommended (ensures latest `main` is tested)

### Step 3: Select Required Status Checks

After enabling "Require status checks to pass", search for and select these checks:

- ✅ `quality-gate` - This is the job name from the workflow that must pass

The status check will appear once the workflow runs on the first PR after the workflow file is merged.

### Step 4: Additional Recommendations

Consider enabling these options:

- ✅ **Require pull request reviews before merging** - Require at least 1 approval
- ✅ **Require code reviews from code owners** - If you have a CODEOWNERS file
- ✅ **Require status checks to pass before merging** - The main requirement
- ✅ **Require conversation resolution before merging** - Require resolving all comments
- ✅ **Require branches to be up to date before merging** - Keep `main` branch in sync before merge

### Step 5: Save

Click **Create** (or **Save changes** if updating existing rule).

## Developer Workflow

### Before Pushing Your PR

It's recommended to run the quality gate checks locally:

```bash
cd concept/apps/web

# Install dependencies
npm install

# Run all checks
npm run build
npm run lint
npm run test

# (Optional) Check coverage
npm run test:coverage
```

### If Checks Fail on PR

1. **Build fails**: Check TypeScript compilation errors in the PR workflow logs
2. **Lint fails**: Run `npm run lint:fix` to auto-fix, or manually fix violations
3. **Tests fail**: Review the failing test output, fix code, and commit changes
4. **Coverage report**: Review the coverage summary comment on the PR; no action needed unless coverage is unexpectedly low

All checks must pass before the PR can be merged.

## Troubleshooting

### "quality-gate check is required but missing"

This means:
- The workflow file is enabled but hasn't run yet on any PR
- Workaround: Merge a dummy PR to `main`, then try again, or temporarily remove the branch protection requirement until the first workflow run completes

### "npm: command not found"

The workflow sets up Node.js 20 and caches dependencies. If this error appears:
- Check that `package-lock.json` exists in `concept/apps/web/`
- Ensure Node.js is properly set up on your local machine (run `npm -v` to verify)

### "ESLint: config not found"

Make sure `.eslintrc.js` is committed to `concept/apps/web/`:

```bash
git add concept/apps/web/.eslintrc.js
git commit -m "Add ESLint configuration"
```

## See Also

- [Vitest Testing Documentation](https://vitest.dev/)
- [ESLint Configuration](concept/apps/web/.eslintrc.js)
- [Prettier Configuration](concept/apps/web/.prettierrc.json)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
