#!/usr/bin/env bash
# =============================================================================
# Taskify Demo Reset Script
# =============================================================================
# Tears down all containers, wipes the database volume, and switches back
# to the baseline branch (deleting the working branch if on one).
#
# Workflow:
#   1. git checkout -b demo/task-decomposition   ← create a working branch
#   2. Run the implement-task-decomposition prompt
#   3. ./reset-demo.sh                           ← tear down and delete branch
# =============================================================================

set -e

echo ""
echo "🔄 Resetting Taskify demo environment..."

# Stop containers and remove volumes
echo "  → Stopping containers and wiping database..."
docker compose down -v 2>/dev/null || true

# Determine current and baseline branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BASE_BRANCH="demo/ui-development"
BRANCH_TO_DELETE="${1:-$CURRENT_BRANCH}"

if [ "$BRANCH_TO_DELETE" = "$BASE_BRANCH" ]; then
  echo "  → Already on baseline branch ($BASE_BRANCH). Nothing to reset."
else
  echo "  → Switching to baseline branch ($BASE_BRANCH)..."
  git checkout "$BASE_BRANCH"
  echo "  → Deleting working branch ($BRANCH_TO_DELETE)..."
  git branch -D "$BRANCH_TO_DELETE"
fi

# Rebuild and start baseline
echo "  → Rebuilding baseline environment..."
docker compose up --build -d

# Wait for health
echo "  → Waiting for services to be healthy..."
retries=15
until curl -sf http://localhost:3000/api/health > /dev/null 2>&1; do
  retries=$((retries - 1))
  if [ $retries -le 0 ]; then
    echo ""
    echo "❌ Services did not become healthy in time."
    exit 1
  fi
  sleep 2
done

echo ""
echo "✅ Demo environment reset and ready!"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000"
echo ""
echo "   To re-run the demo:"
echo "     git checkout -b demo/task-decomposition"
echo "     # Then invoke the implement-task-decomposition prompt"
echo ""
