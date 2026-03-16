# Branch Protection Guardrail Hook

## Description

This Copilot hook enforces that all code changes for this demo are committed **only** to the `demo/performance-testing` branch. Creating new branches is prohibited — all work must stay on the current demo branch.

## Trigger

- **Event**: Pre-commit, branch creation, any git operation
- **Condition**: Always active

## Rules

### Rule 1: No New Branches
- **Check**: If the current git operation would create a new branch, **BLOCK** it
- **Message**: "❌ Branch creation is not allowed. All work must stay on `demo/performance-testing`. Use `git checkout demo/performance-testing` to switch back."

### Rule 2: Correct Branch Verification
- **Check**: Before any commit, verify the current branch is `demo/performance-testing`
- **Action**: If on a different branch, warn and refuse to proceed
- **Message**: "⚠️ You are on branch `{current_branch}`. All changes must be committed to `demo/performance-testing`. Run: `git checkout demo/performance-testing`"

### Rule 3: No Force Push to Other Branches
- **Check**: If a push targets any branch other than `demo/performance-testing`, **BLOCK** it
- **Message**: "❌ Push rejected. Only `demo/performance-testing` is allowed as a push target."

## Validation Command

```bash
# Verify current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "demo/performance-testing" ]; then
  echo "❌ ERROR: Current branch is '$CURRENT_BRANCH'. Must be 'demo/performance-testing'."
  echo "   Run: git checkout demo/performance-testing"
  exit 1
fi
echo "✅ On correct branch: demo/performance-testing"
```

## Rationale

This demo is designed to showcase a complete performance testing workflow on a single feature branch. Creating additional branches would:
- Complicate the demo flow
- Risk losing changes across branches
- Deviate from the intended linear commit history
- Make the GitHub Actions workflow triggers unpredictable
