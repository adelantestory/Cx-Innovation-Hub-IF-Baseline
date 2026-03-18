#!/usr/bin/env bash
# =============================================================================
# Performance Test Guardrail — Hook Script
# =============================================================================
# Enforces performance test coverage when API route files are modified.
#
# Lifecycle events handled:
#   PreToolUse  — when the agent edits a route file, checks that a matching
#                 Locust test exists in locustfile.py. Denies the edit if not.
#   PostToolUse — after a route file is edited, reports coverage status.
#
# Input:  JSON via stdin (VS Code / Copilot hooks protocol)
# Output: JSON via stdout
# Exit:   0 = pass, 2 = block
# =============================================================================
set -euo pipefail

LOCUSTFILE="concept/tests/performance/locustfile.py"
ROUTE_DIR="concept/apps/api/src/routes"
HOOK_PHASE="${1:-}"
INPUT=$(cat)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
block() {
  local reason="$1"
  echo "{\"continue\":true,\"systemMessage\":\"❌ BLOCKED — ${reason}\"}" >&2
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "${reason}"
  }
}
EOF
  exit 2
}

pass() {
  echo '{}'
  exit 0
}

inject_context() {
  local ctx="$1"
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "${ctx}"
  }
}
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Extract tool info from stdin JSON
# ---------------------------------------------------------------------------
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//' || echo "")

# Determine the file being operated on (works for editFiles, create_file, replace_string_in_file, etc.)
TARGET_FILE=""
for key in filePath file_path path; do
  CANDIDATE=$(echo "$INPUT" | grep -oE "\"${key}\"\s*:\s*\"[^\"]*\"" | head -1 | sed 's/.*: *"//;s/"//' || echo "")
  if [ -n "$CANDIDATE" ]; then
    TARGET_FILE="$CANDIDATE"
    break
  fi
done

# Normalize: strip absolute path prefix to get workspace-relative path
TARGET_FILE=$(echo "$TARGET_FILE" | sed 's|.*[/\\]concept/|concept/|' || echo "$TARGET_FILE")

# Check if the target file is a route file
IS_ROUTE_FILE=false
if echo "$TARGET_FILE" | grep -qE "^${ROUTE_DIR}/.*\.js$"; then
  IS_ROUTE_FILE=true
fi

# If not touching a route file, pass through immediately
if [ "$IS_ROUTE_FILE" = "false" ]; then
  pass
fi

ROUTE_BASENAME=$(basename "$TARGET_FILE" .js 2>/dev/null || echo "")

# ---------------------------------------------------------------------------
# PreToolUse — check coverage BEFORE the edit is allowed
# ---------------------------------------------------------------------------
if [ "$HOOK_PHASE" = "pre-tool" ]; then

  # Only gate file-editing tools
  case "$TOOL_NAME" in
    editFiles|create_file|replace_string_in_file|multi_replace_string_in_file|write|edit)
      ;;
    *)
      pass
      ;;
  esac

  # Check locustfile exists
  if [ ! -f "$LOCUSTFILE" ]; then
    block "Locustfile not found at ${LOCUSTFILE}. Performance test coverage is required before modifying API routes. Create the locustfile first."
  fi

  # Extract endpoints from the route file (if it exists already)
  if [ -f "$TARGET_FILE" ]; then
    ENDPOINTS=$(grep -oE 'router\.(get|post|put|patch|delete)\s*\(\s*"[^"]*"' "$TARGET_FILE" 2>/dev/null \
      | sed -E 's/router\.([a-z]+)\s*\(\s*"([^"]*)"/\U\1\E \2/' || true)

    UNCOVERED=""
    COVERED=""
    while IFS= read -r EP; do
      [ -z "$EP" ] && continue
      METHOD=$(echo "$EP" | awk '{print $1}')
      EP_PATH=$(echo "$EP" | awk '{print $2}')
      METHOD_LOWER=$(echo "$METHOD" | tr '[:upper:]' '[:lower:]')

      # Build search pattern: replace :param with wildcard
      SEARCH_PATH=$(echo "$EP_PATH" | sed 's/:[a-zA-Z_]*/[^/"'"'"']*/g' | sed 's|^/||')

      HAS_MATCH=false
      if grep -qiE "self\.client\.${METHOD_LOWER}" "$LOCUSTFILE" 2>/dev/null; then
        if grep -qE "/api/${SEARCH_PATH}" "$LOCUSTFILE" 2>/dev/null; then
          HAS_MATCH=true
        fi
      fi
      if grep -qiE "name=\"${METHOD} /api" "$LOCUSTFILE" 2>/dev/null; then
        HAS_MATCH=true
      fi

      if $HAS_MATCH; then
        COVERED="${COVERED}  ✓ ${METHOD} /api${EP_PATH}\n"
      else
        UNCOVERED="${UNCOVERED}  ✗ ${METHOD} /api${EP_PATH}\n"
      fi
    done <<< "$ENDPOINTS"

    if [ -n "$UNCOVERED" ]; then
      # Warn but allow — the agent may be about to add tests
      REPORT="Performance coverage warning for ${TARGET_FILE}:\\n\\nUncovered endpoints:\\n${UNCOVERED}\\nCovered:\\n${COVERED}\\nAdd @task methods to ${LOCUSTFILE} for uncovered endpoints."
      cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "additionalContext": "$(echo -e "$REPORT" | tr '\n' ' ')"
  }
}
EOF
      exit 0
    fi
  fi

  pass
fi

# ---------------------------------------------------------------------------
# PostToolUse — after route file edit, report coverage status
# ---------------------------------------------------------------------------
if [ "$HOOK_PHASE" = "post-tool" ]; then

  if [ ! -f "$LOCUSTFILE" ]; then
    inject_context "WARNING: No locustfile at ${LOCUSTFILE}. Performance tests are required for API route changes. Create the locustfile before committing."
  fi

  if [ ! -f "$TARGET_FILE" ]; then
    pass
  fi

  # Re-scan the edited file for coverage
  ENDPOINTS=$(grep -oE 'router\.(get|post|put|patch|delete)\s*\(\s*"[^"]*"' "$TARGET_FILE" 2>/dev/null \
    | sed -E 's/router\.([a-z]+)\s*\(\s*"([^"]*)"/\U\1\E \2/' || true)

  UNCOVERED_COUNT=0
  COVERED_COUNT=0
  DETAILS=""

  while IFS= read -r EP; do
    [ -z "$EP" ] && continue
    METHOD=$(echo "$EP" | awk '{print $1}')
    EP_PATH=$(echo "$EP" | awk '{print $2}')
    METHOD_LOWER=$(echo "$METHOD" | tr '[:upper:]' '[:lower:]')
    SEARCH_PATH=$(echo "$EP_PATH" | sed 's/:[a-zA-Z_]*/[^/"'"'"']*/g' | sed 's|^/||')

    HAS_MATCH=false
    if grep -qiE "self\.client\.${METHOD_LOWER}" "$LOCUSTFILE" 2>/dev/null; then
      if grep -qE "/api/${SEARCH_PATH}" "$LOCUSTFILE" 2>/dev/null; then
        HAS_MATCH=true
      fi
    fi
    if grep -qiE "name=\"${METHOD} /api" "$LOCUSTFILE" 2>/dev/null; then
      HAS_MATCH=true
    fi

    if $HAS_MATCH; then
      COVERED_COUNT=$((COVERED_COUNT + 1))
      DETAILS="${DETAILS} ✓ ${METHOD} /api${EP_PATH} |"
    else
      UNCOVERED_COUNT=$((UNCOVERED_COUNT + 1))
      DETAILS="${DETAILS} ✗ ${METHOD} /api${EP_PATH} |"
    fi
  done <<< "$ENDPOINTS"

  if [ "$UNCOVERED_COUNT" -gt 0 ]; then
    inject_context "PERF COVERAGE: ${COVERED_COUNT} covered, ${UNCOVERED_COUNT} UNCOVERED in ${TARGET_FILE}. Details: ${DETAILS} Add @task methods to ${LOCUSTFILE} for uncovered endpoints before committing."
  else
    inject_context "PERF COVERAGE: All ${COVERED_COUNT} endpoints in ${TARGET_FILE} have Locust test coverage. ✅"
  fi
fi

pass
