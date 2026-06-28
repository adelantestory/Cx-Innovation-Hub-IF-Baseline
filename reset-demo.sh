#!/usr/bin/env bash
# =============================================================================
# reset-demo.sh — Reset the Taskify demo working tree
# =============================================================================
# Reverts all tracked file modifications and removes untracked files so the
# repository is clean for the next demo run.
#
# Usage (from repo root):
#   bash reset-demo.sh
#
# What it does:
#   1. Discards all uncommitted changes to tracked files (git checkout)
#   2. Removes untracked files and directories (git clean)
#   3. Confirms the clean state
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC}  $*"; }
info() { echo -e "${BLUE}→${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; exit 1; }

# ── Pre-flight ─────────────────────────────────────────────────────────────────
[[ -f "CLAUDE.md" ]] || err "Run reset-demo.sh from the repository root (where CLAUDE.md lives)"
command -v git >/dev/null || err "git not found"

CURRENT_BRANCH=$(git branch --show-current)
info "Current branch: ${BOLD}${CURRENT_BRANCH}${NC}"

# ── Warn if there are staged changes ──────────────────────────────────────────
if ! git diff --cached --quiet; then
  warn "You have staged changes. These will also be reverted."
fi

# ── 1. Revert all tracked modifications ───────────────────────────────────────
info "Reverting all modifications to tracked files..."
git checkout -- .
log "Tracked files restored"

# ── 2. Remove untracked files and directories ─────────────────────────────────
info "Removing untracked files and directories..."
# -f  force removal
# -d  recurse into untracked directories
# -x  also remove files ignored by .gitignore (node_modules, dist, etc.)
git clean -fdx --exclude=".env" --exclude=".env.local"
log "Untracked files removed"

# ── 3. Confirm clean state ────────────────────────────────────────────────────
if git diff --quiet && git diff --cached --quiet; then
  log "Working tree is clean on branch ${BOLD}${CURRENT_BRANCH}${NC}"
else
  warn "Working tree is not fully clean — check 'git status' for details"
fi
